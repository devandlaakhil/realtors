import { inject, Injectable } from '@angular/core';
import { environment } from '../../environments/environment';
import { HttpClient } from '@angular/common/http';

@Injectable({
  providedIn: 'root',
})
export class SubscriptionApiService {
  private http = inject(HttpClient);

  private _serverPort = environment.serverPort;
  private _apiUrl = 'subscription-api-service';

  createOrder(plan: string) {
    return this.http.post(`${this._serverPort}/${this._apiUrl}/create-order`, { plan });
  }

  verifyPayment(payload: any) {
    return this.http.post(`${this._serverPort}/${this._apiUrl}/verify-payment`, payload);
  }
}
