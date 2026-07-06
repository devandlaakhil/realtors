import { HttpClient } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { environment } from '../../environments/environment';

@Injectable({ providedIn: 'root' })
export class BeautyWellnessApiService {
  private http = inject(HttpClient);
  private readonly baseUrl = `${environment.serverPort}/beauty-wellness-services`;

  getNearby(params?: any): Observable<any> {
    return this.http.get(`${this.baseUrl}/get-beauty-wellness-services`, { params });
  }

  create(body: FormData): Observable<any> {
    return this.http.post(`${this.baseUrl}/create-beauty-wellness-service`, body);
  }

  getMine(): Observable<any> {
    return this.http.get(`${this.baseUrl}/get-my-beauty-wellness-services`);
  }

  delete(id: string): Observable<any> {
    return this.http.delete(`${this.baseUrl}/delete-beauty-wellness-service`, { params: { id } });
  }
}
