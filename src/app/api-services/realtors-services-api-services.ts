import { inject, Injectable } from '@angular/core';
import { Observable, throwError } from 'rxjs';
import { API_CONSTANTS } from '../constants/realtors-services-api-constants';
import { SupabaseCommercialVehicleApiService } from './supabase-commercial-vehicle-api-service';

@Injectable({
  providedIn: 'root',
})
export class RealtorsServicesApiServices {
  private supabaseCommercialVehicles = inject(SupabaseCommercialVehicleApiService);

  get<T>(endpoint: string, params?: any): Observable<T> {
    if (!this.supabaseCommercialVehicles.enabled) return this.notConfigured();
    if (endpoint === API_CONSTANTS.commercialVehicleServices.list) {
      return this.supabaseCommercialVehicles.list(params) as Observable<T>;
    }
    if (endpoint === API_CONSTANTS.commercialVehicleServices.mylist) {
      return this.supabaseCommercialVehicles.mine() as Observable<T>;
    }
    if (endpoint === API_CONSTANTS.commercialVehicleServices.getSingleItem) {
      return this.supabaseCommercialVehicles.single(params?.id) as Observable<T>;
    }
    return this.unsupportedEndpoint(endpoint);
  }

  post<T>(endpoint: string, body: any): Observable<T> {
    if (!this.supabaseCommercialVehicles.enabled) return this.notConfigured();
    if (endpoint === API_CONSTANTS.commercialVehicleServices.save) {
      return this.supabaseCommercialVehicles.create(body) as Observable<T>;
    }
    return this.unsupportedEndpoint(endpoint);
  }

  put<T>(endpoint: string, body: any): Observable<T> {
    if (!this.supabaseCommercialVehicles.enabled) return this.notConfigured();
    if (endpoint === API_CONSTANTS.commercialVehicleServices.updateItem) {
      return this.supabaseCommercialVehicles.update(body) as Observable<T>;
    }
    return this.unsupportedEndpoint(endpoint);
  }

  patch<T>(endpoint: string, body: any): Observable<T> {
    if (!this.supabaseCommercialVehicles.enabled) return this.notConfigured();
    if (endpoint === API_CONSTANTS.commercialVehicleServices.statusUpdate) {
      return this.supabaseCommercialVehicles.toggleStatus(body?.id) as Observable<T>;
    }
    return this.unsupportedEndpoint(endpoint);
  }

  delete<T>(endpoint: string,params?: any): Observable<T> {
    if (!this.supabaseCommercialVehicles.enabled) return this.notConfigured();
    if (endpoint === API_CONSTANTS.commercialVehicleServices.delete) {
      return this.supabaseCommercialVehicles.delete(params?.id) as Observable<T>;
    }
    return this.unsupportedEndpoint(endpoint);
  }

  private notConfigured<T>(): Observable<T> {
    return throwError(() => new Error('Supabase commercial vehicle services are not configured.'));
  }

  private unsupportedEndpoint<T>(endpoint: string): Observable<T> {
    return throwError(() => new Error(`Unsupported commercial vehicle endpoint: ${endpoint}`));
  }
}
