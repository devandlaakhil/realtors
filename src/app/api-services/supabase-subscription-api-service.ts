import { inject, Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { AuthService } from '../auth-services/auth-services';
import { SupabaseClientService } from '../shared-services/supabase-client.service';

@Injectable({ providedIn: 'root' })
export class SupabaseSubscriptionApiService {
  private readonly supabase = inject(SupabaseClientService);
  private readonly auth = inject(AuthService);

  get enabled(): boolean {
    return this.supabase.enabled;
  }

  createOrder(plan: string): Observable<any> {
    return this.supabase.invokeFunction<any>('create-razorpay-order', { plan }, this.requireToken());
  }

  verifyPayment(payload: any): Observable<any> {
    return this.supabase.invokeFunction<any>('verify-razorpay-payment', payload, this.requireToken());
  }

  private requireToken(): string {
    const token = this.auth.getToken();
    if (!token) throw new Error('Please login before payment.');
    return token;
  }
}
