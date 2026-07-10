import { inject, Injectable } from '@angular/core';
import { Observable, throwError } from 'rxjs';
import { environment } from '../../environments/environment';
import { SupabaseHomeRepairApiService } from './supabase-home-repair-api-service';

@Injectable({ providedIn: 'root' })
export class HardwareShopApiService {
  private readonly supabaseHomeRepair = inject(SupabaseHomeRepairApiService);
  private readonly useSupabaseHomeRepair = environment.supabaseFeatures?.homeRepairServices ?? true;

  getNearby(params?: { lat?: number; lng?: number; repairType?: string }): Observable<any> {
    if (!this.isSupabaseEnabled()) return this.notConfigured();
    return this.supabaseHomeRepair.getNearby(params);
  }

  create(body: FormData): Observable<any> {
    if (!this.isSupabaseEnabled()) return this.notConfigured();
    return this.supabaseHomeRepair.create(body);
  }

  getMyShops(): Observable<any> {
    if (!this.isSupabaseEnabled()) return this.notConfigured();
    return this.supabaseHomeRepair.getMyShops();
  }

  SingleShop<T>(endpoint: string, params?: any): Observable<T> {
    if (!this.isSupabaseEnabled()) return this.notConfigured();
    return this.supabaseHomeRepair.getSingle(params?.id) as Observable<T>;
  }

  update(body: FormData): Observable<any> {
    if (!this.isSupabaseEnabled()) return this.notConfigured();
    return this.supabaseHomeRepair.update(body);
  }

  updateStatus(id: string): Observable<any> {
    if (!this.isSupabaseEnabled()) return this.notConfigured();
    return this.supabaseHomeRepair.updateStatus(id);
  }

  deleteShop(id: string): Observable<any> {
    if (!this.isSupabaseEnabled()) return this.notConfigured();
    return this.supabaseHomeRepair.deleteShop(id);
  }

  private isSupabaseEnabled(): boolean {
    return this.useSupabaseHomeRepair && this.supabaseHomeRepair.enabled;
  }

  private notConfigured<T>(): Observable<T> {
    return throwError(() => new Error('Supabase home repair services are not configured.'));
  }
}
