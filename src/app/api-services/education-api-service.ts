import { HttpClient } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { environment } from '../../environments/environment';
import { API_CONSTANTS } from '../constants/realtors-services-api-constants';

@Injectable({ providedIn: 'root' })
export class EducationApiService {
  private http = inject(HttpClient);
  private readonly baseUrl = `${environment.serverPort}/education-services`;
  private readonly endpoints = API_CONSTANTS.educationApiService;

  getNearby(params?: any): Observable<any> {
    return this.http.get(`${this.baseUrl}/${this.endpoints.list}`, { params });
  }

  create(body: FormData): Observable<any> {
    return this.http.post(`${this.baseUrl}/${this.endpoints.save}`, body);
  }

  getMine(): Observable<any> {
    return this.http.get(`${this.baseUrl}/${this.endpoints.mylist}`);
  }

  getSingle(id: string): Observable<any> {
    return this.http.get(`${this.baseUrl}/${this.endpoints.getSingleItem}`, { params: { id } });
  }

  update(id: string, body: FormData): Observable<any> {
    return this.http.put(`${this.baseUrl}/${this.endpoints.updateItem}`, body, { params: { id } });
  }

  updateStatus(id: string): Observable<any> {
    return this.http.patch(`${this.baseUrl}/${this.endpoints.statusUpdate}`, { id });
  }

  delete(id: string): Observable<any> {
    return this.http.delete(`${this.baseUrl}/${this.endpoints.delete}`, { params: { id } });
  }
}
