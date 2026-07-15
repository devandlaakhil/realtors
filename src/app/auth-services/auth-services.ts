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
    this.setLocal(this.TOKEN_KEY, token);
  }

  setRefreshToken(token?: string) {
    if (token) {
      this.setLocal(this.REFRESH_TOKEN_KEY, token);
    }
  }

  getToken(): string | null {
    return this.getLocal(this.TOKEN_KEY);
  }

  getRefreshToken(): string | null {
    return this.getLocal(this.REFRESH_TOKEN_KEY);
  }

  setUser(user: { id: string; name: string; email: string }) {
    this.setLocal(this.USER_KEY, JSON.stringify(user));
  }

  getUser() {
    const data = this.getLocal(this.USER_KEY);

    if (!data) {
      return null;
    }

    try {
      return JSON.parse(data);
    } catch {
      this.removeLocal(this.USER_KEY);
      return null;
    }
  }

  isLoggedIn(): boolean {
    return !!this.getToken();
  }

  logout() {
    this.removeLocal(this.TOKEN_KEY);
    this.removeLocal(this.REFRESH_TOKEN_KEY);
    this.removeLocal(this.USER_KEY);
    this.removeSession(this.TOKEN_KEY);
    this.removeSession(this.REFRESH_TOKEN_KEY);
    this.removeSession(this.USER_KEY);
  }

  private migrateSession(): void {
    const sessionToken = this.getSession(this.TOKEN_KEY);
    const sessionUser = this.getSession(this.USER_KEY);

    if (!this.getLocal(this.TOKEN_KEY) && sessionToken) {
      this.setLocal(this.TOKEN_KEY, sessionToken);
    }

    if (!this.getLocal(this.USER_KEY) && sessionUser) {
      this.setLocal(this.USER_KEY, sessionUser);
    }

    this.removeSession(this.TOKEN_KEY);
    this.removeSession(this.USER_KEY);
  }

  private getLocal(key: string): string | null {
    try {
      return localStorage.getItem(key);
    } catch {
      return null;
    }
  }

  private setLocal(key: string, value: string): void {
    try {
      localStorage.setItem(key, value);
    } catch {
      // Storage can be unavailable in restricted WebView contexts.
    }
  }

  private removeLocal(key: string): void {
    try {
      localStorage.removeItem(key);
    } catch {
      // Storage can be unavailable in restricted WebView contexts.
    }
  }

  private getSession(key: string): string | null {
    try {
      return sessionStorage.getItem(key);
    } catch {
      return null;
    }
  }

  private removeSession(key: string): void {
    try {
      sessionStorage.removeItem(key);
    } catch {
      // Storage can be unavailable in restricted WebView contexts.
    }
  }
}
