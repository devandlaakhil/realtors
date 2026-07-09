import { Injectable } from '@angular/core';

@Injectable({
  providedIn: 'root',
})
export class AuthService {

  private readonly TOKEN_KEY = 'token';
  private readonly REFRESH_TOKEN_KEY = 'refreshToken';
  private readonly USER_KEY = 'user';

  constructor() {
    this.migrateSession();
  }

  logIn(token: string) {
    localStorage.setItem(this.TOKEN_KEY, token);
  }

  setRefreshToken(token?: string) {
    if (token) {
      localStorage.setItem(this.REFRESH_TOKEN_KEY, token);
    }
  }

  getToken(): string | null {
    return localStorage.getItem(this.TOKEN_KEY);
  }

  setUser(user: { id: string; name: string; email: string }) {
    localStorage.setItem(this.USER_KEY, JSON.stringify(user));
  }

  getUser() {
    const data = localStorage.getItem(this.USER_KEY);

    if (!data) {
      return null;
    }

    try {
      return JSON.parse(data);
    } catch {
      localStorage.removeItem(this.USER_KEY);
      return null;
    }
  }

  isLoggedIn(): boolean {
    return !!this.getToken();
  }

  logout() {
    localStorage.removeItem(this.TOKEN_KEY);
    localStorage.removeItem(this.REFRESH_TOKEN_KEY);
    localStorage.removeItem(this.USER_KEY);
    sessionStorage.removeItem(this.TOKEN_KEY);
    sessionStorage.removeItem(this.REFRESH_TOKEN_KEY);
    sessionStorage.removeItem(this.USER_KEY);
  }

  private migrateSession(): void {
    const sessionToken = sessionStorage.getItem(this.TOKEN_KEY);
    const sessionUser = sessionStorage.getItem(this.USER_KEY);

    if (!localStorage.getItem(this.TOKEN_KEY) && sessionToken) {
      localStorage.setItem(this.TOKEN_KEY, sessionToken);
    }

    if (!localStorage.getItem(this.USER_KEY) && sessionUser) {
      localStorage.setItem(this.USER_KEY, sessionUser);
    }

    sessionStorage.removeItem(this.TOKEN_KEY);
    sessionStorage.removeItem(this.USER_KEY);
  }
}
