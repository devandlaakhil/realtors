import { inject, Injectable } from '@angular/core';
import { HttpClient, HttpContext } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../environments/environment';
import { SKIP_AUTH_REDIRECT } from '../interceptors/auth.interceptors';
import { SupabaseAuthApiService } from './supabase-auth-api-service';
import { SupabaseUserProfileApiService } from './supabase-user-profile-api-service';

@Injectable({
  providedIn: 'root',
})
export class UserApiServices {

  private _apiUrl = 'user';
  http = inject(HttpClient);
  private supabaseAuth = inject(SupabaseAuthApiService);
  private supabaseProfile = inject(SupabaseUserProfileApiService);

  login(data:any):Observable<any>{
    if (this.supabaseAuth.enabled) {
      return this.supabaseAuth.login(data);
    }
    return this.http.post<any>(`${environment.serverPort}/${this._apiUrl}/login`,data) 
  }

   register(user:any):Observable<any>{
    if (this.supabaseAuth.enabled) {
      return this.supabaseAuth.register(user);
    }
    return this.http.post<any>(`${environment.serverPort}/${this._apiUrl}/register`, user)
  }

  sendCoordsToBackend(coords: { latitude: number, longitude: number }):Observable<any> {
    if (this.supabaseProfile.enabled) {
      return this.supabaseProfile.getAddress(coords);
    }
    return this.http.post<any>(`${environment.serverPort}/${this._apiUrl}/get-address`, coords)
  }

  getUser(skipAuthRedirect = false):Observable<any>{
    if (this.supabaseProfile.enabled) {
      return this.supabaseProfile.getProfile();
    }
    const context = skipAuthRedirect
      ? new HttpContext().set(SKIP_AUTH_REDIRECT, true)
      : undefined;
    return this.http.get<any>(`${environment.serverPort}/${this._apiUrl}/profile`, { context })
  }

  updateUserDetails(data:any):Observable<any>{
    if (this.supabaseProfile.enabled) {
      return this.supabaseProfile.updateProfile(data);
    }
    return this.http.put<any>(`${environment.serverPort}/${this._apiUrl}/update-profile`,data) 
  }

  updateUserPassword(data:any):Observable<any>{
    if (this.supabaseProfile.enabled) {
      return this.supabaseProfile.updatePassword(data);
    }
    return this.http.put<any>(`${environment.serverPort}/${this._apiUrl}/update-password`,data) 
  }

}
 
