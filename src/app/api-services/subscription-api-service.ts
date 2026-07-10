import { inject, Injectable } from '@angular/core';
import { environment } from '../../environments/environment';
import { HttpClient } from '@angular/common/http';
import { SupabaseSubscriptionApiService } from './supabase-subscription-api-service';

@Injectable({
  providedIn: 'root',
})
export class SubscriptionApiService {
  private http = inject(HttpClient);
  private supabaseSubscription = inject(SupabaseSubscriptionApiService);

  private _serverPort = environment.serverPort;
  private _apiUrl = 'subscription-api-service';

  createOrder(plan: string) {
    if (this.supabaseSubscription.enabled) {
      return this.supabaseSubscription.createOrder(plan);
    }
    return this.http.post(`${this._serverPort}/${this._apiUrl}/create-order`, { plan });
  }

  verifyPayment(payload: any) {
    if (this.supabaseSubscription.enabled) {
      return this.supabaseSubscription.verifyPayment(payload);
    }
    return this.http.post(`${this._serverPort}/${this._apiUrl}/verify-payment`, payload);
  }
}
