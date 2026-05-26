import { inject, Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../environments/environment';

@Injectable({
  providedIn: 'root',
})
export class UserApiServices {

  private _apiUrl = 'user';
  http = inject(HttpClient);

  login(data:any):Observable<any>{
    return this.http.post<any>(`${environment.serverPort}/${this._apiUrl}/login`,data) 
  }

   register(user:any):Observable<any>{
    return this.http.post<any>(`${environment.serverPort}/${this._apiUrl}/register`, user)
  }
}
 