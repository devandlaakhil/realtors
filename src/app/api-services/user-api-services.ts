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

  sendCoordsToBackend(coords: { latitude: number, longitude: number }):Observable<any> {
    return this.http.post<any>(`${environment.serverPort}/${this._apiUrl}/get-address`, coords)
  }

  getUser():Observable<any>{
    return this.http.get<any>(`${environment.serverPort}/${this._apiUrl}/profile`)
  }

  updateUserDetails(data:any):Observable<any>{
    return this.http.put<any>(`${environment.serverPort}/${this._apiUrl}/update-profile`,data) 
  }

  updateUserPassword(data:any):Observable<any>{
    return this.http.put<any>(`${environment.serverPort}/${this._apiUrl}/update-password`,data) 
  }

}
 