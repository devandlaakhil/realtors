import { inject, Injectable } from '@angular/core';
import { Observable, throwError } from 'rxjs';
import { SupabaseCategoryServiceApi } from './supabase-category-service-api';

@Injectable({ providedIn: 'root' })
export class BeautyWellnessApiService {
  private supabaseApi = inject(SupabaseCategoryServiceApi);

  getNearby(params?: any): Observable<any> {
    if (!this.supabaseApi.enabled) return this.notConfigured();
    return this.supabaseApi.list('beauty', params);
  }

  create(body: FormData): Observable<any> {
    if (!this.supabaseApi.enabled) return this.notConfigured();
    return this.supabaseApi.create('beauty', body);
  }

  getMine(): Observable<any> {
    if (!this.supabaseApi.enabled) return this.notConfigured();
    return this.supabaseApi.mine('beauty');
  }

  getSingle(id: string): Observable<any> {
    if (!this.supabaseApi.enabled) return this.notConfigured();
    return this.supabaseApi.single('beauty', id);
  }

  update(id: string, body: FormData): Observable<any> {
    if (!this.supabaseApi.enabled) return this.notConfigured();
    return this.supabaseApi.update('beauty', id, body);
  }

  updateStatus(id: string): Observable<any> {
    if (!this.supabaseApi.enabled) return this.notConfigured();
    return this.supabaseApi.toggleStatus('beauty', id);
  }

  delete(id: string): Observable<any> {
    if (!this.supabaseApi.enabled) return this.notConfigured();
    return this.supabaseApi.delete('beauty', id);
  }

  private notConfigured<T>(): Observable<T> {
    return throwError(() => new Error('Supabase beauty and wellness services are not configured.'));
  }
}
