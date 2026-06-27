import { HttpClient } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { environment } from '../../environments/environment';

@Injectable({ providedIn: 'root' })
export class HardwareShopApiService {
  private readonly http = inject(HttpClient);
  private readonly baseUrl = `${environment.serverPort}/shop-services`;

  getNearby(params: { lat: number; lng: number }): Observable<any> {
    return this.http.get(`${this.baseUrl}/get-nearby-hardware-shops`, { params });
  }

  create(body: FormData): Observable<any> {
    return this.http.post(`${this.baseUrl}/create-shop`, body);
  }
}
