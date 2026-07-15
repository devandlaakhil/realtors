import { HttpClient } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { environment } from '../../environments/environment';
import { API_CONSTANTS } from '../constants/realtors-services-api-constants';
import { SupabaseDriverApiService } from './supabase-driver-api-service';

@Injectable({ providedIn: 'root' })
export class DriverApiServices {
  private http = inject(HttpClient);
  private supabaseDriver = inject(SupabaseDriverApiService);
  private readonly baseUrl = `${environment.serverPort}/driver-services`;

  get<T>(endpoint: string, params?: any): Observable<T> {
    if (this.supabaseDriver.enabled) {
      if (endpoint === API_CONSTANTS.driverServices.list) return this.supabaseDriver.list(params) as Observable<T>;
      if (endpoint === API_CONSTANTS.driverServices.mylist) return this.supabaseDriver.mine() as Observable<T>;
      if (endpoint === API_CONSTANTS.driverServices.getSingleItem) return this.supabaseDriver.single(params?.id) as Observable<T>;
    }
    return this.http.get<T>(`${this.baseUrl}/${endpoint}`, { params });
  }

  post<T>(endpoint: string, body: any): Observable<T> {
    if (this.supabaseDriver.enabled && endpoint === API_CONSTANTS.driverServices.save) {
      return this.supabaseDriver.create(body) as Observable<T>;
    }
    return this.http.post<T>(`${this.baseUrl}/${endpoint}`, body);
  }

  put<T>(endpoint: string, body: any): Observable<T> {
    if (this.supabaseDriver.enabled && endpoint === API_CONSTANTS.driverServices.updateItem) {
      return this.supabaseDriver.update(body) as Observable<T>;
    }
    return this.http.put<T>(`${this.baseUrl}/${endpoint}`, body);
  }

  patch<T>(endpoint: string, body: any): Observable<T> {
    if (this.supabaseDriver.enabled && endpoint === API_CONSTANTS.driverServices.statusUpdate) {
      return this.supabaseDriver.toggleStatus(body?.id) as Observable<T>;
    }
    return this.http.patch<T>(`${this.baseUrl}/${endpoint}`, body);
  }

  delete<T>(endpoint: string, params?: any): Observable<T> {
    if (this.supabaseDriver.enabled && endpoint === API_CONSTANTS.driverServices.delete) {
      return this.supabaseDriver.delete(params?.id) as Observable<T>;
    }
    return this.http.delete<T>(`${this.baseUrl}/${endpoint}`, { params });
  }
}
