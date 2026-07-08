import { HttpClient } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { BehaviorSubject, catchError, Observable, shareReplay, tap, throwError } from 'rxjs';
import { environment } from '../../environments/environment';

export type DynamicFieldType =
  | 'text'
  | 'textarea'
  | 'number'
  | 'tel'
  | 'email'
  | 'date'
  | 'time'
  | 'select'
  | 'checkbox'
  | 'image'
  | 'location';

export interface DynamicCategoryField {
  key: string;
  label: string;
  type: DynamicFieldType;
  required: boolean;
  placeholder?: string;
  options?: string[];
  multiple?: boolean;
  accept?: string;
}

export interface DynamicServiceCategory {
  id?: string;
  name: string;
  slug: string;
  description?: string;
  iconUrl?: string;
  sectionName?: string;
  status?: 'DRAFT' | 'PUBLISHED';
  fields: DynamicCategoryField[];
}

@Injectable({ providedIn: 'root' })
export class DynamicCategoryApiService {
  private http = inject(HttpClient);
  private readonly baseUrl = `${environment.serverPort}/dynamic-service-categories`;
  private categoriesSubject = new BehaviorSubject<DynamicServiceCategory[]>([]);
  private publishedRequest$: Observable<any> | null = null;
  readonly categories$ = this.categoriesSubject.asObservable();

  loadPublished(forceRefresh = false): Observable<any> {
    if (!forceRefresh && this.publishedRequest$) {
      return this.publishedRequest$;
    }

    this.publishedRequest$ = this.http.get<any>(`${this.baseUrl}/published`).pipe(
      tap((response) => {
        const data = response?.data ?? response?.categories ?? response ?? [];
        this.categoriesSubject.next(Array.isArray(data) ? data : []);
      }),
      catchError((error) => {
        this.publishedRequest$ = null;
        return throwError(() => error);
      }),
      shareReplay({ bufferSize: 1, refCount: true }),
    );

    return this.publishedRequest$;
  }

  getCategory(slug: string): Observable<any> {
    return this.http.get(`${this.baseUrl}/${encodeURIComponent(slug)}`);
  }

  createCategory(category: DynamicServiceCategory): Observable<any> {
    return this.http.post(`${this.baseUrl}`, category);
  }

  deleteCategory(slug: string): Observable<any> {
    return this.http.delete(`${this.baseUrl}/${encodeURIComponent(slug)}`).pipe(
      tap(() => this.categoriesSubject.next(
        this.categoriesSubject.value.filter((category) => category.slug !== slug),
      )),
    );
  }

  getPosts(slug: string, params?: any): Observable<any> {
    return this.http.get(`${this.baseUrl}/${encodeURIComponent(slug)}/posts`, { params });
  }

  createPost(slug: string, body: FormData): Observable<any> {
    return this.http.post(`${this.baseUrl}/${encodeURIComponent(slug)}/posts`, body);
  }

  deletePost(slug: string, id: string): Observable<any> {
    return this.http.delete(
      `${this.baseUrl}/${encodeURIComponent(slug)}/posts/${encodeURIComponent(id)}`,
    );
  }
}
