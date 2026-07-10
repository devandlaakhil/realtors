import { HttpClient, HttpContext, HttpHeaders, HttpParams } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { Observable, throwError } from 'rxjs';
import { environment } from '../../environments/environment';
import { SKIP_AUTH_HEADER, SKIP_AUTH_REDIRECT } from '../interceptors/auth.interceptors';
import { AuthService } from '../auth-services/auth-services';

type SupabaseFilterValue = string | number | boolean | null | undefined;

export interface SupabaseSelectOptions {
  select?: string;
  filters?: Record<string, SupabaseFilterValue>;
  order?: string;
  limit?: number;
  range?: [number, number];
}

@Injectable({ providedIn: 'root' })
export class SupabaseClientService {
  private readonly http = inject(HttpClient);
  private readonly auth = inject(AuthService);
  private readonly supabaseUrl = this.normalizeUrl(environment.supabaseUrl);
  private readonly anonKey = environment.supabaseAnonKey;
  private readonly defaultBucket = environment.supabaseStorageBucket || 'service-images';
  private readonly context = new HttpContext()
    .set(SKIP_AUTH_HEADER, true)
    .set(SKIP_AUTH_REDIRECT, true);

  get enabled(): boolean {
    return Boolean(this.supabaseUrl && this.anonKey);
  }

  select<T>(table: string, options: SupabaseSelectOptions = {}): Observable<T[]> {
    if (!this.enabled) return this.notConfigured<T[]>();

    let params = new HttpParams().set('select', options.select || '*');
    Object.entries(options.filters || {}).forEach(([key, value]) => {
      if (value !== undefined && value !== null && value !== '') {
        params = params.set(key, `eq.${value}`);
      }
    });

    if (options.order) params = params.set('order', options.order);
    if (options.limit) params = params.set('limit', String(options.limit));

    let headers = this.headers();
    if (options.range) {
      headers = headers.set('Range-Unit', 'items').set('Range', `${options.range[0]}-${options.range[1]}`);
    }

    return this.http.get<T[]>(`${this.restUrl}/${table}`, { headers, params, context: this.context });
  }

  selectWithAuth<T>(table: string, accessToken: string, options: SupabaseSelectOptions = {}): Observable<T[]> {
    if (!this.enabled) return this.notConfigured<T[]>();

    let params = new HttpParams().set('select', options.select || '*');
    Object.entries(options.filters || {}).forEach(([key, value]) => {
      if (value !== undefined && value !== null && value !== '') {
        params = params.set(key, `eq.${value}`);
      }
    });

    if (options.order) params = params.set('order', options.order);
    if (options.limit) params = params.set('limit', String(options.limit));

    return this.http.get<T[]>(`${this.restUrl}/${table}`, {
      headers: this.headers(undefined, accessToken),
      params,
      context: this.context
    });
  }

  authPost<T>(path: string, body: unknown): Observable<T> {
    if (!this.enabled) return this.notConfigured<T>();
    return this.http.post<T>(`${this.authUrl}/${path}`, body, {
      headers: this.publicHeaders(),
      context: this.context
    });
  }

  authGet<T>(path: string, accessToken: string): Observable<T> {
    if (!this.enabled) return this.notConfigured<T>();
    return this.http.get<T>(`${this.authUrl}/${path}`, {
      headers: this.headers(undefined, accessToken),
      context: this.context
    });
  }

  authPut<T>(path: string, body: unknown, accessToken: string): Observable<T> {
    if (!this.enabled) return this.notConfigured<T>();
    return this.http.put<T>(`${this.authUrl}/${path}`, body, {
      headers: this.headers(undefined, accessToken),
      context: this.context
    });
  }

  insert<T>(table: string, body: Partial<T> | Partial<T>[]): Observable<T[]> {
    if (!this.enabled) return this.notConfigured<T[]>();
    return this.http.post<T[]>(`${this.restUrl}/${table}`, body, {
      headers: this.headers('return=representation'),
      context: this.context
    });
  }

  insertWithAuth<T>(table: string, body: Partial<T> | Partial<T>[], accessToken: string): Observable<T[]> {
    if (!this.enabled) return this.notConfigured<T[]>();
    return this.http.post<T[]>(`${this.restUrl}/${table}`, body, {
      headers: this.headers('return=representation', accessToken),
      context: this.context
    });
  }

  update<T>(table: string, id: string, body: Partial<T>): Observable<T[]> {
    if (!this.enabled) return this.notConfigured<T[]>();
    const params = new HttpParams().set('id', `eq.${id}`);
    return this.http.patch<T[]>(`${this.restUrl}/${table}`, body, {
      headers: this.headers('return=representation'),
      params,
      context: this.context
    });
  }

  updateWithAuth<T>(table: string, id: string, body: Partial<T>, accessToken: string): Observable<T[]> {
    if (!this.enabled) return this.notConfigured<T[]>();
    const params = new HttpParams().set('id', `eq.${id}`);
    return this.http.patch<T[]>(`${this.restUrl}/${table}`, body, {
      headers: this.headers('return=representation', accessToken),
      params,
      context: this.context
    });
  }

  delete<T>(table: string, id: string): Observable<T[]> {
    if (!this.enabled) return this.notConfigured<T[]>();
    const params = new HttpParams().set('id', `eq.${id}`);
    return this.http.delete<T[]>(`${this.restUrl}/${table}`, {
      headers: this.headers('return=representation'),
      params,
      context: this.context
    });
  }

  deleteWithAuth<T>(table: string, id: string, accessToken: string): Observable<T[]> {
    if (!this.enabled) return this.notConfigured<T[]>();
    const params = new HttpParams().set('id', `eq.${id}`);
    return this.http.delete<T[]>(`${this.restUrl}/${table}`, {
      headers: this.headers('return=representation', accessToken),
      params,
      context: this.context
    });
  }

  upload(file: File, path: string, bucket = this.defaultBucket): Observable<unknown> {
    if (!this.enabled) return this.notConfigured<unknown>();
    const encodedPath = this.encodeStoragePath(path);
    const accessToken = this.auth.getToken() || this.anonKey;
    const uploadUrl = `${this.storageUrl}/object/${bucket}/${encodedPath}`;

    if (!bucket) {
      return throwError(() => new Error('Supabase storage bucket is missing in environment.supabaseStorageBucket.'));
    }

    return this.http.post(uploadUrl, file, {
      headers: this.headers(undefined, accessToken)
        .set('Content-Type', file.type || 'application/octet-stream')
        .set('Cache-Control', '3600')
        .set('x-upsert', 'true'),
      context: this.context
    });
  }

  publicUrl(path: string, bucket = this.defaultBucket): string {
    if (!this.supabaseUrl) return '';
    return `${this.storageUrl}/object/public/${bucket}/${this.encodeStoragePath(path)}`;
  }

  private headers(prefer?: string, accessToken = this.anonKey): HttpHeaders {
    let headers = new HttpHeaders({
      apikey: this.anonKey,
      Authorization: `Bearer ${accessToken}`
    });
    if (prefer) headers = headers.set('Prefer', prefer);
    return headers;
  }

  private publicHeaders(): HttpHeaders {
    return new HttpHeaders({
      apikey: this.anonKey,
      Authorization: `Bearer ${this.anonKey}`
    });
  }

  private get restUrl(): string {
    return `${this.supabaseUrl}/rest/v1`;
  }

  private get authUrl(): string {
    return `${this.supabaseUrl}/auth/v1`;
  }

  private get storageUrl(): string {
    return `${this.supabaseUrl}/storage/v1`;
  }

  private encodeStoragePath(path: string): string {
    return path.split('/').map(encodeURIComponent).join('/');
  }

  private notConfigured<T>(): Observable<T> {
    return throwError(() => new Error('Supabase is not configured. Add supabaseUrl and supabaseAnonKey to the environment file.'));
  }

  private normalizeUrl(url: string): string {
    return (url || '')
      .replace(/\/rest\/v1\/?$/i, '')
      .replace(/\/auth\/v1\/?$/i, '')
      .replace(/\/+$/, '');
  }
}
