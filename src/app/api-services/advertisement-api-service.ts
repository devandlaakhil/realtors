import { HttpClient } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { environment } from '../../environments/environment';
import { SupabaseAdvertisementApiService } from './supabase-advertisement-api-service';

@Injectable({
  providedIn: 'root',
})
export class AdvertisementApiService {
  private http = inject(HttpClient);
  private supabaseAds = inject(SupabaseAdvertisementApiService);

  private _serverPort = environment.serverPort;
  private _apiUrl = 'advertise';

  private getUrl(endpoint: string): string {
    return `${this._serverPort}/${this._apiUrl}/${endpoint}`;
  }

  get<T>(endpoint: string, params?: any): Observable<T> {
    if (this.supabaseAds.enabled && endpoint === 'client-advertisements/active') {
      return this.supabaseAds.listActive(params) as Observable<T>;
    }
    return this.http.get<T>(this.getUrl(endpoint), { params });
  }

  post<T>(endpoint: string, body: any): Observable<T> {
    if (this.supabaseAds.enabled && endpoint === 'client-advertisement') {
      return this.supabaseAds.create(body) as Observable<T>;
    }
    return this.http.post<T>(this.getUrl(endpoint), body);
  }

  put<T>(endpoint: string, body: any): Observable<T> {
    return this.http.put<T>(this.getUrl(endpoint), body);
  }

  patch<T>(endpoint: string, body: any): Observable<T> {
    return this.http.patch<T>(this.getUrl(endpoint), body);
  }

  delete<T>(endpoint: string, params?: any): Observable<T> {
    return this.http.delete<T>(this.getUrl(endpoint), { params });
  }
}
