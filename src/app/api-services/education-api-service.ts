import { inject, Injectable } from '@angular/core';
import { Observable, throwError } from 'rxjs';
import { SupabaseCategoryServiceApi } from './supabase-category-service-api';

@Injectable({ providedIn: 'root' })
export class EducationApiService {
  private supabaseApi = inject(SupabaseCategoryServiceApi);

  getNearby(params?: any): Observable<any> {
    if (!this.supabaseApi.enabled) return this.notConfigured();
    return this.supabaseApi.list('education', params);
  }

  create(body: FormData): Observable<any> {
    if (!this.supabaseApi.enabled) return this.notConfigured();
    return this.supabaseApi.create('education', body);
  }

  getMine(): Observable<any> {
    if (!this.supabaseApi.enabled) return this.notConfigured();
    return this.supabaseApi.mine('education');
  }

  getSingle(id: string): Observable<any> {
    if (!this.supabaseApi.enabled) return this.notConfigured();
    return this.supabaseApi.single('education', id);
  }

  update(id: string, body: FormData): Observable<any> {
    if (!this.supabaseApi.enabled) return this.notConfigured();
    return this.supabaseApi.update('education', id, body);
  }

  updateStatus(id: string): Observable<any> {
    if (!this.supabaseApi.enabled) return this.notConfigured();
    return this.supabaseApi.toggleStatus('education', id);
  }

  delete(id: string): Observable<any> {
    if (!this.supabaseApi.enabled) return this.notConfigured();
    return this.supabaseApi.delete('education', id);
  }

  private notConfigured<T>(): Observable<T> {
    return throwError(() => new Error('Supabase education services are not configured.'));
  }
}
