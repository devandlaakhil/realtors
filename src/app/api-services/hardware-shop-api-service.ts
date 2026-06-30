import { HttpClient } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { environment } from '../../environments/environment';

@Injectable({ providedIn: 'root' })
export class HardwareShopApiService {
  private readonly http = inject(HttpClient);
  private readonly baseUrl = `${environment.serverPort}/shop-services`;

  private getUrl(endpoint: string): string {
    return `${this.baseUrl}/${endpoint}`;
  }

  getNearby(params: { lat: number; lng: number }): Observable<any> {
    return this.http.get(`${this.baseUrl}/get-shops`, { params });
  }

  create(body: FormData): Observable<any> {
    return this.http.post(`${this.baseUrl}/create-shop`, body);
  }

  getMyShops(): Observable<any> {
    return this.http.get(`${this.baseUrl}/get-my-shops`);
  }

  SingleShop<T>(endpoint: string, params?: any): Observable<T> {
    return this.http.get<T>(this.getUrl(endpoint), { params });
  }

  update(body: FormData): Observable<any> {
    return this.http.put(`${this.baseUrl}/update-shop`, body);
  }

  updateStatus(id: string): Observable<any> {
    return this.http.patch(`${this.baseUrl}/update-shop-status`, { id });
  }

  deleteShop(id: string): Observable<any> {
    return this.http.delete(`${this.baseUrl}/delete-shop`, { params: { id } });
  }
}
