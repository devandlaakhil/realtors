import { inject, Injectable } from '@angular/core';
import { Observable, map } from 'rxjs';
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
    const amount = plan === 'ADVERTISEMENT_POST' ? 200 : 0;
    return this.supabase.insertWithAuth<any>(SUPABASE_TABLES.subscriptionPayments, {
      owner_id: this.auth.getUser()?.id || null,
      plan,
      amount,
      currency: 'INR',
      status: 'CREATED'
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
    const id = payload?.razorpay_order_id || payload?.order_id;
    const body = {
      razorpay_payment_id: payload?.razorpay_payment_id || '',
      razorpay_order_id: payload?.razorpay_order_id || id || '',
      razorpay_signature: payload?.razorpay_signature || '',
      status: 'PAID',
      payment_payload: payload || {}
    };

    if (id) {
      return this.supabase.updateWithAuth<any>(SUPABASE_TABLES.subscriptionPayments, id, body, this.requireToken())
        .pipe(map((rows) => ({ data: rows[0], verified: true })));
    }

    return this.supabase.insertWithAuth<any>(SUPABASE_TABLES.subscriptionPayments, {
      owner_id: this.auth.getUser()?.id || null,
      plan: 'UNKNOWN',
      amount: 0,
      currency: 'INR',
      ...body
    }, this.requireToken()).pipe(map((rows) => ({ data: rows[0], verified: true })));
  }

  private requireToken(): string {
    const token = this.auth.getToken();
    if (!token) throw new Error('Please login before payment.');
    return token;
  }
}
