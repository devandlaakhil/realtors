import { inject, Injectable } from '@angular/core';
import {environment} from '../../environments/environment';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

@Injectable({
  providedIn: 'root',
})
export class RealEstateApiServices {

  private _serverPort = environment.serverPort;
  private _apiUrl = "real-estate";
  
  httpClient = inject(HttpClient);

  savePosting(data:any):Observable<any>{
    return this.httpClient.post<any>(`${this._serverPort}/${this._apiUrl}/save-post`,data);
  }
}
