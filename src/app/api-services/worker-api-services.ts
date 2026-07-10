import { inject, Injectable } from '@angular/core';
import { Observable, throwError } from 'rxjs';
import { API_CONSTANTS } from '../constants/realtors-services-api-constants';
import { SupabaseWorkerApiService } from './supabase-worker-api-service';

@Injectable({
  providedIn: 'root',
})
export class WorkerApiServices {
  private supabaseWorker = inject(SupabaseWorkerApiService);

  get<T>(endpoint: string, params?: any): Observable<T> {
    if (!this.supabaseWorker.enabled) return this.notConfigured();
    if (endpoint === API_CONSTANTS.workerapiServices.getAll) {
      return this.supabaseWorker.getAll(params) as Observable<T>;
    }
    if (endpoint === API_CONSTANTS.workerapiServices.getMyPostings) {
      return this.supabaseWorker.getMine() as Observable<T>;
    }
    if (endpoint === API_CONSTANTS.workerapiServices.getSingleItem) {
      return this.supabaseWorker.getSingle(params?.id) as Observable<T>;
    }
    return this.unsupportedEndpoint(endpoint);
  }

  post<T>(endpoint: string, body: any): Observable<T> {
    if (!this.supabaseWorker.enabled) return this.notConfigured();
    if (endpoint === API_CONSTANTS.workerapiServices.save) {
      return this.supabaseWorker.create(body) as Observable<T>;
    }
    return this.unsupportedEndpoint(endpoint);
  }

  put<T>(endpoint: string, body: any): Observable<T> {
    if (!this.supabaseWorker.enabled) return this.notConfigured();
    if (endpoint === API_CONSTANTS.workerapiServices.update) {
      return this.supabaseWorker.update(body) as Observable<T>;
    }
    return this.unsupportedEndpoint(endpoint);
  }

  patch<T>(endpoint: string, body: any): Observable<T> {
    if (!this.supabaseWorker.enabled) return this.notConfigured();
    if (endpoint === API_CONSTANTS.workerapiServices.statusUpdate) {
      return this.supabaseWorker.updateStatus(body?.id) as Observable<T>;
    }
    return this.unsupportedEndpoint(endpoint);
  }

  delete<T>(endpoint: string,params?: any): Observable<T> {
    if (!this.supabaseWorker.enabled) return this.notConfigured();
    if (endpoint === API_CONSTANTS.workerapiServices.delete) {
      return this.supabaseWorker.delete(params?.id) as Observable<T>;
    }
    return this.unsupportedEndpoint(endpoint);
  }

  private notConfigured<T>(): Observable<T> {
    return throwError(() => new Error('Supabase skilled worker services are not configured.'));
  }

  private unsupportedEndpoint<T>(endpoint: string): Observable<T> {
    return throwError(() => new Error(`Unsupported skilled worker endpoint: ${endpoint}`));
  }
}
