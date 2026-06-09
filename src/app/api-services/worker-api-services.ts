import { HttpClient } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { environment } from '../../environments/environment';
import { Observable } from 'rxjs';

@Injectable({
  providedIn: 'root',
})
export class WorkerApiServices {
  private http = inject(HttpClient);

  private _serverPort = environment.serverPort;
  private _apiUrl = 'worker-api-services';

  private getUrl(endpoint: string): string {
    return `${this._serverPort}/${this._apiUrl}/${endpoint}`;
  }

  get<T>(endpoint: string, params?: any): Observable<T> {
    return this.http.get<T>(this.getUrl(endpoint), { params });
  }

  post<T>(endpoint: string, body: any): Observable<T> {
    return this.http.post<T>(this.getUrl(endpoint), body);
  }

  put<T>(endpoint: string, body: any): Observable<T> {
    return this.http.put<T>(this.getUrl(endpoint), body);
  }

  patch<T>(endpoint: string, body: any): Observable<T> {
    return this.http.patch<T>(this.getUrl(endpoint), body);
  }

  delete<T>(endpoint: string,params?: any): Observable<T> {
    return this.http.delete<T>(this.getUrl(endpoint),{ params });
  } 
}
