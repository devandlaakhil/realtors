import { HttpClient } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { environment } from '../../environments/environment';
import { API_CONSTANTS } from '../constants/realtors-services-api-constants';
import { SupabaseCategoryServiceApi } from './supabase-category-service-api';

@Injectable({ providedIn: 'root' })
export class BeautyWellnessApiService {
  private http = inject(HttpClient);
  private supabaseApi = inject(SupabaseCategoryServiceApi);
  private readonly baseUrl = `${environment.serverPort}/beauty-wellness-services`;
  private readonly endpoints = API_CONSTANTS.beautyWellnessApiService;

  getNearby(params?: any): Observable<any> {
    if (this.supabaseApi.enabled) {
      return this.supabaseApi.list('beauty', params);
    }
    return this.http.get(`${this.baseUrl}/${this.endpoints.list}`, { params });
  }

  create(body: FormData): Observable<any> {
    if (this.supabaseApi.enabled) {
      return this.supabaseApi.create('beauty', body);
    }
    return this.http.post(`${this.baseUrl}/${this.endpoints.save}`, body);
  }

  getMine(): Observable<any> {
    if (this.supabaseApi.enabled) {
      return this.supabaseApi.mine('beauty');
    }
    return this.http.get(`${this.baseUrl}/${this.endpoints.mylist}`);
  }

  getSingle(id: string): Observable<any> {
    if (this.supabaseApi.enabled) {
      return this.supabaseApi.single('beauty', id);
    }
    return this.http.get(`${this.baseUrl}/${this.endpoints.getSingleItem}`, { params: { id } });
  }

  update(id: string, body: FormData): Observable<any> {
    if (this.supabaseApi.enabled) {
      return this.supabaseApi.update('beauty', id, body);
    }
    return this.http.put(`${this.baseUrl}/${this.endpoints.updateItem}`, body, { params: { id } });
  }

  updateStatus(id: string): Observable<any> {
    if (this.supabaseApi.enabled) {
      return this.supabaseApi.toggleStatus('beauty', id);
    }
    return this.http.patch(`${this.baseUrl}/${this.endpoints.statusUpdate}`, { id });
  }

  delete(id: string): Observable<any> {
    if (this.supabaseApi.enabled) {
      return this.supabaseApi.delete('beauty', id);
    }
    return this.http.delete(`${this.baseUrl}/${this.endpoints.delete}`, { params: { id } });
  }
}
