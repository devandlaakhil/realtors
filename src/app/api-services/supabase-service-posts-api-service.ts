import { inject, Injectable } from '@angular/core';
import { Observable, map } from 'rxjs';
import { SUPABASE_TABLES, SupabaseServiceType } from '../constants/supabase.constants';
import { SupabaseClientService } from '../shared-services/supabase-client.service';
import { isWithinServiceRadius, SearchCoordinates } from '../shared-services/distance-utils';

export type SupabasePostStatus = 'ACTIVE' | 'INACTIVE';

export interface SupabaseServicePost {
  id?: string;
  service_type: SupabaseServiceType | string;
  owner_id?: string | null;
  title?: string | null;
  category?: string | null;
  price?: number | null;
  unit?: string | null;
  mobile?: string | null;
  location_text?: string | null;
  village?: string | null;
  district?: string | null;
  latitude?: number | null;
  longitude?: number | null;
  images?: string[];
  status?: SupabasePostStatus;
  payload?: Record<string, unknown>;
  created_at?: string;
  updated_at?: string;
}

export interface SupabasePostListOptions extends SearchCoordinates {
  category?: string;
  ownerId?: string;
  activeOnly?: boolean;
  limit?: number;
  radiusKm?: number;
}

@Injectable({ providedIn: 'root' })
export class SupabaseServicePostsApiService {
  private readonly client = inject(SupabaseClientService);
  private readonly table = SUPABASE_TABLES.servicePosts;

  list(serviceType: SupabaseServiceType | string, options: SupabasePostListOptions = {}): Observable<SupabaseServicePost[]> {
    const filters: Record<string, string> = { service_type: serviceType };

    if (options.category && options.category !== 'All') filters['category'] = options.category;
    if (options.ownerId) filters['owner_id'] = options.ownerId;
    if (options.activeOnly !== false) filters['status'] = 'ACTIVE';

    return this.client.select<SupabaseServicePost>(this.table, {
      filters,
      order: 'created_at.desc',
      limit: options.limit
    }).pipe(map((rows) => {
      if (options.ownerId || options.activeOnly === false) return rows;
      return rows.filter((row) => isWithinServiceRadius(options, row.latitude, row.longitude, options.radiusKm));
    }));
  }

  mine(serviceType: SupabaseServiceType | string, ownerId: string): Observable<SupabaseServicePost[]> {
    return this.list(serviceType, { ownerId, activeOnly: false });
  }

  create(post: SupabaseServicePost): Observable<SupabaseServicePost> {
    return this.client.insert<SupabaseServicePost>(this.table, {
      ...post,
      status: post.status || 'ACTIVE',
      payload: post.payload || {}
    }).pipe(map(rows => rows[0]));
  }

  update(id: string, patch: Partial<SupabaseServicePost>): Observable<SupabaseServicePost> {
    return this.client.update<SupabaseServicePost>(this.table, id, patch).pipe(map(rows => rows[0]));
  }

  toggleStatus(id: string, currentlyActive: boolean): Observable<SupabaseServicePost> {
    return this.update(id, { status: currentlyActive ? 'INACTIVE' : 'ACTIVE' });
  }

  remove(id: string): Observable<SupabaseServicePost> {
    return this.client.delete<SupabaseServicePost>(this.table, id).pipe(map(rows => rows[0]));
  }

  uploadImage(file: File, serviceType: SupabaseServiceType | string, ownerId = 'guest'): Observable<string> {
    const safeName = file.name.replace(/[^a-zA-Z0-9._-]/g, '-');
    const path = `${serviceType}/${ownerId}/${Date.now()}-${safeName}`;
    return this.client.upload(file, path).pipe(map(() => this.client.publicUrl(path)));
  }
}
