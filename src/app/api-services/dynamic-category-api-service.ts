import { inject, Injectable } from '@angular/core';
import { BehaviorSubject, catchError, from, map, Observable, shareReplay, switchMap, tap, throwError } from 'rxjs';
import { AuthService } from '../auth-services/auth-services';
import { SUPABASE_SERVICE_TYPES, SUPABASE_TABLES } from '../constants/supabase.constants';
import { SupabaseClientService } from '../shared-services/supabase-client.service';

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

interface DynamicCategoryRow {
  id?: string;
  owner_id?: string | null;
  name: string;
  slug: string;
  description?: string | null;
  icon_url?: string | null;
  section_name?: string | null;
  status?: 'DRAFT' | 'PUBLISHED';
  fields: DynamicCategoryField[];
  created_at?: string;
  updated_at?: string;
}

interface DynamicPostRow {
  id?: string;
  owner_id?: string | null;
  category_slug: string;
  payload: Record<string, any>;
  file_urls?: Record<string, string[]>;
  latitude?: number | null;
  longitude?: number | null;
  status?: 'ACTIVE' | 'INACTIVE';
  created_at?: string;
  updated_at?: string;
}

@Injectable({ providedIn: 'root' })
export class DynamicCategoryApiService {
  private supabase = inject(SupabaseClientService);
  private auth = inject(AuthService);
  private categoriesSubject = new BehaviorSubject<DynamicServiceCategory[]>([]);
  private publishedRequest$: Observable<any> | null = null;
  readonly categories$ = this.categoriesSubject.asObservable();

  loadPublished(forceRefresh = false): Observable<any> {
    if (!forceRefresh && this.publishedRequest$) {
      return this.publishedRequest$;
    }

    if (!this.supabase.enabled) return this.notConfigured();

    this.publishedRequest$ = this.supabase.select<DynamicCategoryRow>(SUPABASE_TABLES.dynamicServiceCategories, {
      filters: { status: 'PUBLISHED' },
      order: 'created_at.desc'
    }).pipe(
      map((rows) => ({ data: rows.map((row) => this.toCategory(row)).filter(Boolean) as DynamicServiceCategory[] })),
      tap((response) => {
        const data = response.data;
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
    if (!this.supabase.enabled) return this.notConfigured();
    return this.supabase.select<DynamicCategoryRow>(SUPABASE_TABLES.dynamicServiceCategories, {
      filters: { slug },
      limit: 1
    }).pipe(map((rows) => ({ data: this.toCategory(rows[0]) })));
  }

  createCategory(category: DynamicServiceCategory): Observable<any> {
    if (!this.supabase.enabled) return this.notConfigured();
    const payload: Partial<DynamicCategoryRow> = {
      owner_id: this.auth.getUser()?.id || null,
      name: category.name,
      slug: category.slug,
      description: category.description || '',
      icon_url: category.iconUrl || '',
      section_name: category.sectionName || 'More Services',
      status: category.status || 'PUBLISHED',
      fields: category.fields || []
    };
    return this.supabase.insertWithAuth<DynamicCategoryRow>(
      SUPABASE_TABLES.dynamicServiceCategories,
      payload,
      this.requireToken()
    ).pipe(
      map((rows) => ({ data: this.toCategory(rows[0]) })),
      tap((response) => {
        if (!response.data) return;
        const next = [...this.categoriesSubject.value.filter((item) => item.slug !== response.data!.slug), response.data];
        this.categoriesSubject.next(next);
        this.publishedRequest$ = null;
      })
    );
  }

  deleteCategory(slug: string): Observable<any> {
    if (!this.supabase.enabled) return this.notConfigured();
    return this.supabase.selectWithAuth<DynamicCategoryRow>(
      SUPABASE_TABLES.dynamicServiceCategories,
      this.requireToken(),
      { filters: { slug }, limit: 1 }
    ).pipe(
      switchMap((rows) => this.supabase.deleteWithAuth<DynamicCategoryRow>(
        SUPABASE_TABLES.dynamicServiceCategories,
        rows[0]?.id || '',
        this.requireToken()
      )),
      tap(() => this.categoriesSubject.next(
        this.categoriesSubject.value.filter((category) => category.slug !== slug),
      )),
    );
  }

  getPosts(slug: string, params?: any): Observable<any> {
    if (!this.supabase.enabled) return this.notConfigured();
    const token = this.auth.getToken();
    const select$ = params?.mine && token
      ? this.supabase.selectWithAuth<DynamicPostRow>(SUPABASE_TABLES.dynamicServicePosts, token, {
        filters: { category_slug: slug, owner_id: params.userId || this.auth.getUser()?.id },
        order: 'created_at.desc'
      })
      : this.supabase.select<DynamicPostRow>(SUPABASE_TABLES.dynamicServicePosts, {
        filters: { category_slug: slug, status: 'ACTIVE' },
        order: 'created_at.desc'
      });

    return select$.pipe(map((rows) => ({ data: rows.map((row) => this.toPost(row)) })));
  }

  createPost(slug: string, body: FormData): Observable<any> {
    if (!this.supabase.enabled) return this.notConfigured();
    return from(this.formDataToPostPayload(slug, body)).pipe(
      switchMap((payload) => this.supabase.insertWithAuth<DynamicPostRow>(
        SUPABASE_TABLES.dynamicServicePosts,
        payload,
        this.requireToken()
      )),
      map((rows) => ({ data: this.toPost(rows[0]) }))
    );
  }

  deletePost(slug: string, id: string): Observable<any> {
    if (!this.supabase.enabled) return this.notConfigured();
    return this.supabase.deleteWithAuth<DynamicPostRow>(
      SUPABASE_TABLES.dynamicServicePosts,
      id,
      this.requireToken()
    ).pipe(map((rows) => ({ data: this.toPost(rows[0]) })));
  }

  private async formDataToPostPayload(slug: string, body: FormData): Promise<Partial<DynamicPostRow>> {
    const payload = JSON.parse(String(body.get('payload') || '{}')) as Record<string, any>;
    const ownerId = this.auth.getUser()?.id || null;
    const fileUrls: Record<string, string[]> = {};
    const uploadTasks: Promise<void>[] = [];

    body.forEach((value, key) => {
      if (!(value instanceof File)) return;
      uploadTasks.push(this.uploadDynamicFile(slug, key, value, ownerId || 'guest').then((url) => {
        fileUrls[key] = [...(fileUrls[key] || []), url];
      }));
    });
    await Promise.all(uploadTasks);

    Object.entries(fileUrls).forEach(([key, urls]) => {
      payload[key] = urls.length === 1 ? urls[0] : urls;
    });

    const lat = Number(body.get('latitude') ?? body.get('lat') ?? payload['latitude'] ?? payload['lat']);
    const lng = Number(body.get('longitude') ?? body.get('lng') ?? payload['longitude'] ?? payload['lng']);
    return {
      owner_id: ownerId,
      category_slug: slug,
      payload,
      file_urls: fileUrls,
      latitude: Number.isFinite(lat) ? lat : null,
      longitude: Number.isFinite(lng) ? lng : null,
      status: 'ACTIVE'
    };
  }

  private uploadDynamicFile(slug: string, key: string, file: File, ownerId: string): Promise<string> {
    const safeName = file.name.replace(/[^a-zA-Z0-9._-]/g, '-');
    const path = `${SUPABASE_SERVICE_TYPES.dynamic}/${slug}/${ownerId}/${key}-${Date.now()}-${safeName}`;
    return new Promise((resolve, reject) => {
      this.supabase.upload(file, path).subscribe({
        next: () => resolve(this.supabase.publicUrl(path)),
        error: reject
      });
    });
  }

  private toCategory(row?: DynamicCategoryRow | null): DynamicServiceCategory | null {
    if (!row) return null;
    return {
      id: row.id,
      name: row.name,
      slug: row.slug,
      description: row.description || '',
      iconUrl: row.icon_url || '',
      sectionName: row.section_name || 'More Services',
      status: row.status || 'PUBLISHED',
      fields: row.fields || []
    };
  }

  private toPost(row?: DynamicPostRow | null): any {
    if (!row) return null;
    return {
      id: row.id,
      _id: row.id,
      categorySlug: row.category_slug,
      data: row.payload || {},
      payload: row.payload || {},
      values: row.payload || {},
      fileUrls: row.file_urls || {},
      latitude: row.latitude,
      longitude: row.longitude,
      location: { coordinates: [row.longitude, row.latitude] },
      status: row.status,
      isActive: row.status === 'ACTIVE',
      createdAt: row.created_at,
      updatedAt: row.updated_at
    };
  }

  private requireToken(): string {
    const token = this.auth.getToken();
    if (!token) throw new Error('Please login before using dynamic services.');
    return token;
  }

  private notConfigured<T>(): Observable<T> {
    return throwError(() => new Error('Supabase dynamic category services are not configured.'));
  }
}
