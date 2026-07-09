import { HttpClient } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { environment } from '../../environments/environment';
import { Observable } from 'rxjs';
import { API_CONSTANTS } from '../constants/realtors-services-api-constants';
import { SupabaseWorkerApiService } from './supabase-worker-api-service';

@Injectable({
  providedIn: 'root',
})
export class WorkerApiServices {
  private http = inject(HttpClient);
  private supabaseWorker = inject(SupabaseWorkerApiService);

  private _serverPort = environment.serverPort;
  private _apiUrl = 'worker-api-services';

  private getUrl(endpoint: string): string {
    return `${this._serverPort}/${this._apiUrl}/${endpoint}`;
  }

  get<T>(endpoint: string, params?: any): Observable<T> {
    if (this.supabaseWorker.enabled) {
      if (endpoint === API_CONSTANTS.workerapiServices.getAll) {
        return this.supabaseWorker.getAll(params) as Observable<T>;
      }
      if (endpoint === API_CONSTANTS.workerapiServices.getMyPostings) {
        return this.supabaseWorker.getMine() as Observable<T>;
      }
      if (endpoint === API_CONSTANTS.workerapiServices.getSingleItem) {
        return this.supabaseWorker.getSingle(params?.id) as Observable<T>;
      }
    }
    return this.http.get<T>(this.getUrl(endpoint), { params });
  }

  post<T>(endpoint: string, body: any): Observable<T> {
    if (this.supabaseWorker.enabled && endpoint === API_CONSTANTS.workerapiServices.save) {
      return this.supabaseWorker.create(body) as Observable<T>;
    }
    return this.http.post<T>(this.getUrl(endpoint), body);
  }

  put<T>(endpoint: string, body: any): Observable<T> {
    if (this.supabaseWorker.enabled && endpoint === API_CONSTANTS.workerapiServices.update) {
      return this.supabaseWorker.update(body) as Observable<T>;
    }
    return this.http.put<T>(this.getUrl(endpoint), body);
  }

  patch<T>(endpoint: string, body: any): Observable<T> {
    if (this.supabaseWorker.enabled && endpoint === API_CONSTANTS.workerapiServices.statusUpdate) {
      return this.supabaseWorker.updateStatus(body?.id) as Observable<T>;
    }
    return this.http.patch<T>(this.getUrl(endpoint), body);
  }

  delete<T>(endpoint: string,params?: any): Observable<T> {
    if (this.supabaseWorker.enabled && endpoint === API_CONSTANTS.workerapiServices.delete) {
      return this.supabaseWorker.delete(params?.id) as Observable<T>;
    }
    return this.http.delete<T>(this.getUrl(endpoint),{ params });
  } 
}
