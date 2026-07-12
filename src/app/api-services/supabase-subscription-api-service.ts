import { inject, Injectable } from '@angular/core';
import { Observable, map, of, switchMap } from 'rxjs';
import { AuthService } from '../auth-services/auth-services';
import { SUPABASE_TABLES } from '../constants/supabase.constants';
import { SupabaseClientService } from '../shared-services/supabase-client.service';

@Injectable({ providedIn: 'root' })
export class SupabaseSubscriptionApiService {
  private readonly supabase = inject(SupabaseClientService);
  private readonly auth = inject(AuthService);

  get enabled(): boolean {
    return this.supabase.enabled;
  }

  createOrder(plan: string): Observable<any> {
    const amount = this.amountForPlan(plan);
    return this.supabase.insertWithAuth<any>(SUPABASE_TABLES.subscriptionPayments, {
      userid: this.auth.getUser()?.id || null,
      plan,
      amount,
      currency: 'INR',
      status: 'PENDING'
    }, this.requireToken()).pipe(
      map((rows) => ({
        data: rows[0],
        order: {
          id: rows[0]?.id,
          amount,
          currency: 'INR'
        }
      }))
    );
  }

  verifyPayment(payload: any): Observable<any> {
    const id = payload?.order_id || payload?.razorpay_order_id;
    const body = {
      razorpay_payment_id: payload?.razorpay_payment_id || '',
      razorpay_order_id: payload?.razorpay_order_id || id || '',
      razorpay_signature: payload?.razorpay_signature || '',
      status: 'SUCCESS',
      payment_payload: payload || {}
    };

    if (id) {
      return this.supabase.updateWithAuth<any>(SUPABASE_TABLES.subscriptionPayments, id, body, this.requireToken())
        .pipe(switchMap((rows) => this.activateSubscription(rows[0])));
    }

    return this.supabase.insertWithAuth<any>(SUPABASE_TABLES.subscriptionPayments, {
      userid: this.auth.getUser()?.id || null,
      plan: 'UNKNOWN',
      amount: 0,
      currency: 'INR',
      ...body
    }, this.requireToken()).pipe(switchMap((rows) => this.activateSubscription(rows[0])));
  }

  private amountForPlan(plan: string): number {
    const amounts: Record<string, number> = {
      PROPERTY_PRO: 100,
      SERVICE_PRO: 200,
      BUSINESS_PRO: 500,
      ADVERTISEMENT_POST: 200
    };

    return amounts[plan] ?? 0;
  }

  private activateSubscription(payment: any): Observable<any> {
    if (!payment || payment.plan === 'ADVERTISEMENT_POST') {
      return of({ data: payment, verified: true });
    }

    const start = new Date();
    const end = new Date(start);
    end.setFullYear(end.getFullYear() + 1);
    const subscriptionPatch = {
      subscription_start_date: start.toISOString(),
      subscription_end_date: end.toISOString(),
      expires_at: end.toISOString()
    };

    return this.supabase.updateWithAuth<any>(SUPABASE_TABLES.subscriptionPayments, payment.id, subscriptionPatch, this.requireToken()).pipe(
      switchMap((payments) => this.supabase.updateWithAuth<any>(SUPABASE_TABLES.profiles, this.auth.getUser()?.id || '', {
        subscription_plan: payment.plan,
        subscription_start_date: subscriptionPatch.subscription_start_date,
        subscription_end_date: subscriptionPatch.subscription_end_date
      }, this.requireToken()).pipe(
        map((profiles) => ({ data: payments[0] || payment, profile: profiles[0], verified: true }))
      ))
    );
  }

  private requireToken(): string {
    const token = this.auth.getToken();
    if (!token) throw new Error('Please login before payment.');
    return token;
  }
}
