import { inject, Injectable } from '@angular/core';
import { Observable, from, map, switchMap } from 'rxjs';
import { AuthService } from '../auth-services/auth-services';
import { SUPABASE_SERVICE_TYPES, SUPABASE_TABLES } from '../constants/supabase.constants';
import { SupabaseClientService } from '../shared-services/supabase-client.service';
import { isWithinServiceRadius, radiusBoundingBox } from '../shared-services/distance-utils';
import { PostingAccessService } from '../shared-services/posting-access.service';

export interface SupabaseSkilledWorker {
  id?: string;
  owner_id?: string | null;
  name: string;
  category: string;
  mobile: string;
  price?: number | null;
  village?: string | null;
  district?: string | null;
  experience?: number | null;
  is_active?: boolean;
  team_size?: number | null;
  skills?: string[];
  cleaning_category?: string | null;
  role?: string | null;
  image_url?: string | null;
  latitude?: number | null;
  longitude?: number | null;
  status?: 'ACTIVE' | 'INACTIVE';
  created_at?: string;
  updated_at?: string;
}

@Injectable({ providedIn: 'root' })
export class SupabaseWorkerApiService {
  private readonly supabase = inject(SupabaseClientService);
  private readonly auth = inject(AuthService);
  private readonly postingAccess = inject(PostingAccessService);
  private readonly table = SUPABASE_TABLES.skilledWorkers;

  get enabled(): boolean {
    return this.supabase.enabled;
  }

  getAll(params?: { lat?: number; lng?: number; category?: string }): Observable<{ data: any[] }> {
    return this.supabase.select<SupabaseSkilledWorker>(this.table, {
      filters: {
        status: 'ACTIVE',
        ...(params?.category ? { category: params.category } : {}),
      },
      filterOps: radiusBoundingBox(params),
      order: 'created_at.desc'
    }).pipe(map((rows) => ({
      data: rows
        .filter((row) => isWithinServiceRadius(params, row.latitude, row.longitude))
        .map((row) => this.toComponentWorker(row))
    })));
  }

  getMine(): Observable<{ data: any[] }> {
    return this.supabase.selectWithAuth<SupabaseSkilledWorker>(this.table, this.requireToken(), {
      filters: { owner_id: this.auth.getUser()?.id },
      order: 'created_at.desc'
    }).pipe(map((rows) => ({ data: rows.map((row) => this.toComponentWorker(row)) })));
  }

  getSingle(id: string): Observable<{ data: any }> {
    return this.supabase.selectWithAuth<SupabaseSkilledWorker>(this.table, this.requireToken(), {
      filters: { id },
      limit: 1
    }).pipe(map((rows) => ({ data: this.toComponentWorker(rows[0]) })));
  }

  create(body: FormData): Observable<{ data: any }> {
    return this.postingAccess.assertCanCreatePost().pipe(
      switchMap(() => from(this.formDataToPayload(body))),
      switchMap((payload) => this.supabase.insertWithAuth<SupabaseSkilledWorker>(
        this.table,
        payload,
        this.requireToken()
      )),
      map((rows) => ({ data: this.toComponentWorker(rows[0]) }))
    );
  }

  update(body: FormData): Observable<{ data: any }> {
    const id = String(body.get('id') || '');
    return from(this.formDataToPayload(body, false)).pipe(
      switchMap((payload) => this.supabase.updateWithAuth<SupabaseSkilledWorker>(
        this.table,
        id,
        payload,
        this.requireToken()
      )),
      map((rows) => ({ data: this.toComponentWorker(rows[0]) }))
    );
  }

  updateStatus(id: string): Observable<{ data: any }> {
    return this.getSingle(id).pipe(
      switchMap((res) => this.supabase.updateWithAuth<SupabaseSkilledWorker>(
        this.table,
        id,
        {
          status: res.data?.status === 'ACTIVE' || res.data?.isActive ? 'INACTIVE' : 'ACTIVE',
          is_active: !(res.data?.status === 'ACTIVE' || res.data?.isActive)
        },
        this.requireToken()
      )),
      map((rows) => ({ data: this.toComponentWorker(rows[0]) }))
    );
  }

  delete(id: string): Observable<{ data: any }> {
    return this.supabase.deleteWithAuth<SupabaseSkilledWorker>(this.table, id, this.requireToken())
      .pipe(map((rows) => ({ data: this.toComponentWorker(rows[0]) })));
  }

  private async formDataToPayload(body: FormData, forceActive = true): Promise<Partial<SupabaseSkilledWorker>> {
    const raw = JSON.parse(String(body.get('payload') || '{}'));
    const imageFile = body.get('images');
    const ownerId = this.auth.getUser()?.id || null;
    let imageUrl = typeof raw.image === 'string' ? raw.image : null;

    if (imageFile instanceof File) {
      imageUrl = await this.uploadImage(imageFile, ownerId || 'guest');
    }

    const active = raw.isActive !== false;
    const latitude = Number(raw.latitude);
    const longitude = Number(raw.longitude);
    if (!this.isUsableLocation(latitude, longitude)) {
      throw new Error('Please select a valid service location before posting.');
    }

    return {
      owner_id: ownerId,
      name: raw.name || '',
      category: raw.category || '',
      mobile: raw.mobile || '',
      price: raw.price === '' ? null : Number(raw.price),
      village: raw.village || '',
      district: raw.district || '',
      experience: raw.experience ?? 0,
      is_active: active,
      team_size: raw.teamSize ?? 0,
      skills: Array.isArray(raw.skills) ? raw.skills : [],
      cleaning_category: raw.cleaningCategory || '',
      role: raw.role || '',
      image_url: imageUrl,
      latitude,
      longitude,
      ...(forceActive ? { status: active ? 'ACTIVE' as const : 'INACTIVE' as const } : {})
    };
  }

  private isUsableLocation(latitude: number, longitude: number): boolean {
    return Number.isFinite(latitude) && Number.isFinite(longitude) && latitude !== 0 && longitude !== 0;
  }

  private uploadImage(file: File, ownerId: string): Promise<string> {
    const safeName = file.name.replace(/[^a-zA-Z0-9._-]/g, '-');
    const path = `${SUPABASE_SERVICE_TYPES.worker}/${ownerId}/${Date.now()}-${safeName}`;
    return new Promise((resolve, reject) => {
      this.supabase.upload(file, path).subscribe({
        next: () => resolve(this.supabase.publicUrl(path)),
        error: reject
      });
    });
  }

  private toComponentWorker(row?: SupabaseSkilledWorker | null): any {
    if (!row) return null;
    return {
      id: row.id,
      _id: row.id,
      name: row.name,
      category: row.category,
      mobile: row.mobile,
      price: row.price,
      village: row.village,
      district: row.district,
      experience: row.experience,
      isActive: row.status ? row.status === 'ACTIVE' : row.is_active !== false,
      teamSize: row.team_size,
      skills: row.skills || [],
      cleaningCategory: row.cleaning_category,
      cleaningType: row.cleaning_category,
      role: row.role,
      image: row.image_url ? [{ url: row.image_url }] : [],
      imageUrl: row.image_url,
      location: {
        coordinates: [row.longitude, row.latitude]
      },
      latitude: row.latitude,
      longitude: row.longitude,
      status: row.status,
      createdAt: row.created_at,
      updatedAt: row.updated_at
    };
  }

  private requireToken(): string {
    const token = this.auth.getToken();
    if (!token) throw new Error('Please login before using skilled worker services.');
    return token;
  }
}
