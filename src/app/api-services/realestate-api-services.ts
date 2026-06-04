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

  getAllList(lat?: number, lng?: number): Observable<any> {
    let url = `${this._serverPort}/${this._apiUrl}/getpropeties`;
    if (lat && lng) {
      url += `?lat=${lat}&lng=${lng}`;
    }
    return this.httpClient.get<any>(url);
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

  getListins(): Observable<any> {
    return this.httpClient.get<any>(`${this._serverPort}/${this._apiUrl}/get-my-listings`);
  }
  deleteMyPost(id: string): Observable<any> {
    return this.httpClient.delete<any>(`${this._serverPort}/${this._apiUrl}/delete-my-listings`, {
      params: { id: id },
    });
  }

  sendQuery(data: any): Observable<any> {
    return this.httpClient.post<any>(`${this._serverPort}/${this._apiUrl}/send-message`, data);
  }

  getMessages(propertyId: string): Observable<any> {
    return this.httpClient.get(`${this._serverPort}/${this._apiUrl}/messages/${propertyId}`);
  }

  getMyMessage(): Observable<any> {
    return this.httpClient.get(`${this._serverPort}/${this._apiUrl}/get-my-messages`);
  }

  getConversations(conversationId: string) {
    return this.httpClient.get(
      `${this._serverPort}/${this._apiUrl}/conversation/${conversationId}`,
    );
  }

  replayQuery(data: any): Observable<any> {
    return this.httpClient.post<any>(`${this._serverPort}/${this._apiUrl}/reply-message`, data);
  }
}
