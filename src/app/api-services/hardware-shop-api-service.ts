import { HttpClient } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { environment } from '../../environments/environment';
import { SupabaseHomeRepairApiService } from './supabase-home-repair-api-service';

@Injectable({ providedIn: 'root' })
export class HardwareShopApiService {
  private readonly http = inject(HttpClient);
  private readonly supabaseHomeRepair = inject(SupabaseHomeRepairApiService);
  private readonly baseUrl = `${environment.serverPort}/shop-services`;

  private getUrl(endpoint: string): string {
    return `${this.baseUrl}/${endpoint}`;
  }

  getNearby(params?: { lat?: number; lng?: number; repairType?: string }): Observable<any> {
    if (this.supabaseHomeRepair.enabled) {
      return this.supabaseHomeRepair.getNearby(params);
    }
    return this.http.get(`${this.baseUrl}/get-shops`, { params });
  }

  create(body: FormData): Observable<any> {
    if (this.supabaseHomeRepair.enabled) {
      return this.supabaseHomeRepair.create(body);
    }
    return this.http.post(`${this.baseUrl}/create-shop`, body);
  }

  getMyShops(): Observable<any> {
    if (this.supabaseHomeRepair.enabled) {
      return this.supabaseHomeRepair.getMyShops();
    }
    return this.http.get(`${this.baseUrl}/get-my-shops`);
  }

  SingleShop<T>(endpoint: string, params?: any): Observable<T> {
    if (this.supabaseHomeRepair.enabled) {
      return this.supabaseHomeRepair.getSingle(params?.id) as Observable<T>;
    }
    return this.http.get<T>(this.getUrl(endpoint), { params });
  }

  update(body: FormData): Observable<any> {
    if (this.supabaseHomeRepair.enabled) {
      return this.supabaseHomeRepair.update(body);
    }
    return this.http.put(`${this.baseUrl}/update-shop`, body);
  }

  updateStatus(id: string): Observable<any> {
    if (this.supabaseHomeRepair.enabled) {
      return this.supabaseHomeRepair.updateStatus(id);
    }
    return this.http.patch(`${this.baseUrl}/update-shop-status`, { id });
  }

  deleteShop(id: string): Observable<any> {
    if (this.supabaseHomeRepair.enabled) {
      return this.supabaseHomeRepair.deleteShop(id);
    }
    return this.http.delete(`${this.baseUrl}/delete-shop`, { params: { id } });
  }
}
