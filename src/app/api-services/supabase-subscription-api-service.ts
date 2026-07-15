import { inject, Injectable } from '@angular/core';
import { catchError, Observable, throwError } from 'rxjs';
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
    return this.supabase.invokeFunction<any>('create-razorpay-order', { plan }, this.requireToken()).pipe(
      catchError((error) => throwError(() => this.toPaymentError(error, 'create-razorpay-order')))
    );
  }

  verifyPayment(payload: any): Observable<any> {
    return this.supabase.invokeFunction<any>('verify-razorpay-payment', payload, this.requireToken()).pipe(
      catchError((error) => throwError(() => this.toPaymentError(error, 'verify-razorpay-payment')))
    );
  }

  private requireToken(): string {
    const token = this.auth.getToken();
    if (!token) throw new Error('Please login before payment.');
    return token;
  }

  private toPaymentError(error: any, functionName: string): Error {
    const status = error?.status;
    const message =
      error?.error?.message ||
      error?.message ||
      `Unable to call Supabase function ${functionName}.`;

    if (status === 404) {
      return new Error(
        `Supabase function "${functionName}" is not deployed or is not available in this project. Deploy it from the Supabase CLI.`,
      );
    }

    if (status === 401 || status === 403) {
      return new Error(
        `Supabase function "${functionName}" rejected the request. Check JWT auth and function secrets.`,
      );
    }

    return new Error(message);
  }
}
