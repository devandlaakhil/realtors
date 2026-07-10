import { inject, Injectable } from '@angular/core';
import { Observable, throwError } from 'rxjs';
import { API_CONSTANTS } from '../constants/realtors-services-api-constants';
import { SupabaseTransportApiService } from './supabase-transport-api-service';

@Injectable({
  providedIn: 'root',
})
export class TransportApiService {
  private supabaseTransport = inject(SupabaseTransportApiService);

  get<T>(endpoint: string, params?: any): Observable<T> {
    if (!this.supabaseTransport.enabled) return this.notConfigured();
    if (endpoint === API_CONSTANTS.transportApiService.getNearByVehicles) {
      return this.supabaseTransport.list(params) as Observable<T>;
    }
    if (endpoint === API_CONSTANTS.transportApiService.getMyVehiclePosts) {
      return this.supabaseTransport.mine() as Observable<T>;
    }
    if (endpoint === API_CONSTANTS.transportApiService.getSingleVehicle) {
      return this.supabaseTransport.single(params?.id) as Observable<T>;
    }
    return this.unsupportedEndpoint(endpoint);
  }

  post<T>(endpoint: string, body: any): Observable<T> {
    if (!this.supabaseTransport.enabled) return this.notConfigured();
    if (endpoint === API_CONSTANTS.transportApiService.save) {
      return this.supabaseTransport.create(body) as Observable<T>;
    }
    return this.unsupportedEndpoint(endpoint);
  }

  put<T>(endpoint: string, body: any): Observable<T> {
    if (!this.supabaseTransport.enabled) return this.notConfigured();
    if (endpoint === API_CONSTANTS.transportApiService.updateVehicle) {
      return this.supabaseTransport.update(body) as Observable<T>;
    }
    return this.unsupportedEndpoint(endpoint);
  }

  patch<T>(endpoint: string, body: any): Observable<T> {
    if (!this.supabaseTransport.enabled) return this.notConfigured();
    if (endpoint === API_CONSTANTS.transportApiService.updateVehicleStatus) {
      return this.supabaseTransport.toggleStatus(body?.id) as Observable<T>;
    }
    return this.unsupportedEndpoint(endpoint);
  }

  delete<T>(endpoint: string,params?: any): Observable<T> {
    if (!this.supabaseTransport.enabled) return this.notConfigured();
    if (endpoint === API_CONSTANTS.transportApiService.delete) {
      return this.supabaseTransport.delete(params?.id) as Observable<T>;
    }
    return this.unsupportedEndpoint(endpoint);
  }

  private notConfigured<T>(): Observable<T> {
    return throwError(() => new Error('Supabase vehicle services are not configured.'));
  }

  private unsupportedEndpoint<T>(endpoint: string): Observable<T> {
    return throwError(() => new Error(`Unsupported vehicle endpoint: ${endpoint}`));
  }
}
