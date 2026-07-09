import { HttpClient } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { environment } from '../../environments/environment';
import { Observable } from 'rxjs';
import { API_CONSTANTS } from '../constants/realtors-services-api-constants';
import { SupabaseTransportApiService } from './supabase-transport-api-service';

@Injectable({
  providedIn: 'root',
})
export class TransportApiService {
  private http = inject(HttpClient);
  private supabaseTransport = inject(SupabaseTransportApiService);

  private _serverPort = environment.serverPort;
  private _apiUrl = 'transport-api-services';

  private getUrl(endpoint: string): string {
    return `${this._serverPort}/${this._apiUrl}/${endpoint}`;
  }

  get<T>(endpoint: string, params?: any): Observable<T> {
    if (this.supabaseTransport.enabled) {
      if (endpoint === API_CONSTANTS.transportApiService.getNearByVehicles) {
        return this.supabaseTransport.list(params) as Observable<T>;
      }
      if (endpoint === API_CONSTANTS.transportApiService.getMyVehiclePosts) {
        return this.supabaseTransport.mine() as Observable<T>;
      }
      if (endpoint === API_CONSTANTS.transportApiService.getSingleVehicle) {
        return this.supabaseTransport.single(params?.id) as Observable<T>;
      }
    }
    return this.http.get<T>(this.getUrl(endpoint), { params });
  }

  post<T>(endpoint: string, body: any): Observable<T> {
    if (this.supabaseTransport.enabled && endpoint === API_CONSTANTS.transportApiService.save) {
      return this.supabaseTransport.create(body) as Observable<T>;
    }
    return this.http.post<T>(this.getUrl(endpoint), body);
  }

  put<T>(endpoint: string, body: any): Observable<T> {
    if (this.supabaseTransport.enabled && endpoint === API_CONSTANTS.transportApiService.updateVehicle) {
      return this.supabaseTransport.update(body) as Observable<T>;
    }
    return this.http.put<T>(this.getUrl(endpoint), body);
  }

  patch<T>(endpoint: string, body: any): Observable<T> {
    if (this.supabaseTransport.enabled && endpoint === API_CONSTANTS.transportApiService.updateVehicleStatus) {
      return this.supabaseTransport.toggleStatus(body?.id) as Observable<T>;
    }
    return this.http.patch<T>(this.getUrl(endpoint), body);
  }

  delete<T>(endpoint: string,params?: any): Observable<T> {
    if (this.supabaseTransport.enabled && endpoint === API_CONSTANTS.transportApiService.delete) {
      return this.supabaseTransport.delete(params?.id) as Observable<T>;
    }
    return this.http.delete<T>(this.getUrl(endpoint),{ params });
  }
}
