import { inject, Injectable } from '@angular/core';
import { environment } from '../../environments/environment';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

@Injectable({
  providedIn: 'root',
})
export class RealEstateApiService {
  private _serverPort = environment.serverPort;
  private _apiUrl = 'real-estate';

  httpClient = inject(HttpClient);

  getAllList(): Observable<any> {
    return this.httpClient.get<any>(`${this._serverPort}/${this._apiUrl}/getpropeties`);
  }

  getProduct(id: string): Observable<any> {
    return this.httpClient.get<any>(`${this._serverPort}/${this._apiUrl}/getSinglepropety`, {
      params: { id: id },
    });
  }

  savePosting(data: any): Observable<any> {
    return this.httpClient.post<any>(`${this._serverPort}/${this._apiUrl}/save-post`, data);
  }

  updatePosting(id: string, data: FormData): Observable<any> {
    return this.httpClient.put<any>(`${this._serverPort}/${this._apiUrl}/update-post/${id}`, data);
  }

  getMyProperties(): Observable<any> {
    return this.httpClient.get<any>(`${this._serverPort}/${this._apiUrl}/get-my-properties`);
  }

  updateAvailabilityStatus(id: string): Observable<any> {
    return this.httpClient.patch<any>(
      `${this._serverPort}/${this._apiUrl}/update-status/${id}`,
      {},
    );
  }

  getListins():Observable<any>{
     return this.httpClient.get<any>(`${this._serverPort}/${this._apiUrl}/get-my-listings`);
  }
}
