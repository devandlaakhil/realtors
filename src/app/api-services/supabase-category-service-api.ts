import { inject, Injectable } from '@angular/core';
import { Observable, from, map, switchMap } from 'rxjs';
import { AuthService } from '../auth-services/auth-services';
import { SUPABASE_SERVICE_TYPES, SUPABASE_TABLES } from '../constants/supabase.constants';
import { SupabaseClientService } from '../shared-services/supabase-client.service';
import { isWithinServiceRadius } from '../shared-services/distance-utils';

type ServiceKind = 'beauty' | 'education';
type Status = 'ACTIVE' | 'INACTIVE';

interface CategoryServiceRow {
  id?: string;
  owner_id?: string | null;
  name: string;
  business_name?: string | null;
  mobile: string;
  category: string;
  additional_skills: string[];
  service_for?: string | null;
  home_service?: boolean;
  teaching_mode?: string | null;
  student_level?: string | null;
  experience?: number | null;
  starting_price?: number | null;
  village?: string | null;
  district?: string | null;
  description?: string | null;
  image_url?: string | null;
  latitude?: number | null;
  longitude?: number | null;
  status?: Status;
  created_at?: string;
  updated_at?: string;
}

@Injectable({ providedIn: 'root' })
export class SupabaseCategoryServiceApi {
  private readonly supabase = inject(SupabaseClientService);
  private readonly auth = inject(AuthService);

  get enabled(): boolean {
    return this.supabase.enabled;
  }

  list(kind: ServiceKind, params?: any): Observable<{ data: any[] }> {
    return this.supabase.select<CategoryServiceRow>(this.table(kind), {
      filters: {
        status: 'ACTIVE',
        ...(params?.category ? { category: params.category } : {})
      },
      order: 'created_at.desc'
    }).pipe(map((rows) => ({
      data: rows
        .filter((row) => isWithinServiceRadius(params, row.latitude, row.longitude))
        .map((row) => this.toComponent(row, kind))
    })));
  }

  mine(kind: ServiceKind): Observable<{ data: any[] }> {
    return this.supabase.selectWithAuth<CategoryServiceRow>(this.table(kind), this.requireToken(), {
      filters: { owner_id: this.auth.getUser()?.id },
      order: 'created_at.desc'
    }).pipe(map((rows) => ({ data: rows.map((row) => this.toComponent(row, kind)) })));
  }

  single(kind: ServiceKind, id: string): Observable<{ data: any }> {
    return this.supabase.selectWithAuth<CategoryServiceRow>(this.table(kind), this.requireToken(), {
      filters: { id },
      limit: 1
    }).pipe(map((rows) => ({ data: this.toComponent(rows[0], kind) })));
  }

  create(kind: ServiceKind, body: FormData): Observable<{ data: any }> {
    return from(this.formDataToPayload(kind, body)).pipe(
      switchMap((payload) => this.supabase.insertWithAuth<CategoryServiceRow>(
        this.table(kind),
        payload,
        this.requireToken()
      )),
      map((rows) => ({ data: this.toComponent(rows[0], kind) }))
    );
  }

  update(kind: ServiceKind, id: string, body: FormData): Observable<{ data: any }> {
    return from(this.formDataToPayload(kind, body, false)).pipe(
      switchMap((payload) => this.supabase.updateWithAuth<CategoryServiceRow>(
        this.table(kind),
        id,
        payload,
        this.requireToken()
      )),
      map((rows) => ({ data: this.toComponent(rows[0], kind) }))
    );
  }

  toggleStatus(kind: ServiceKind, id: string): Observable<{ data: any }> {
    return this.single(kind, id).pipe(
      switchMap((res) => this.supabase.updateWithAuth<CategoryServiceRow>(
        this.table(kind),
        id,
        { status: res.data?.status === 'ACTIVE' ? 'INACTIVE' : 'ACTIVE' },
        this.requireToken()
      )),
      map((rows) => ({ data: this.toComponent(rows[0], kind) }))
    );
  }

  delete(kind: ServiceKind, id: string): Observable<{ data: any }> {
    return this.supabase.deleteWithAuth<CategoryServiceRow>(this.table(kind), id, this.requireToken())
      .pipe(map((rows) => ({ data: this.toComponent(rows[0], kind) })));
  }

  private async formDataToPayload(kind: ServiceKind, body: FormData, forceActive = true): Promise<Partial<CategoryServiceRow>> {
    const raw = JSON.parse(String(body.get('payload') || '{}'));
    const ownerId = this.auth.getUser()?.id || null;
    const imageFile = body.get('images');
    let imageUrl = typeof raw.image === 'string' ? raw.image : null;

    if (imageFile instanceof File) {
      imageUrl = await this.uploadImage(kind, imageFile, ownerId || 'guest');
    }

    const payload: Partial<CategoryServiceRow> = {
      owner_id: ownerId,
      name: raw.name || '',
      business_name: raw.businessName || '',
      mobile: raw.mobile || '',
      category: raw.category || '',
      additional_skills: Array.isArray(raw.additionalSkills) ? raw.additionalSkills : [],
      experience: raw.experience ?? 0,
      starting_price: raw.startingPrice === '' ? null : Number(raw.startingPrice),
      village: raw.village || '',
      district: raw.district || '',
      description: raw.description || '',
      image_url: imageUrl,
      latitude: raw.latitude ?? null,
      longitude: raw.longitude ?? null,
      ...(forceActive ? { status: 'ACTIVE' as const } : {})
    };

    if (kind === 'beauty') {
      payload.service_for = raw.serviceFor || null;
      payload.home_service = !!raw.homeService;
    }

    if (kind === 'education') {
      payload.teaching_mode = raw.teachingMode || null;
      payload.student_level = raw.studentLevel || null;
    }

    return payload;
  }

  private uploadImage(kind: ServiceKind, file: File, ownerId: string): Promise<string> {
    const safeName = file.name.replace(/[^a-zA-Z0-9._-]/g, '-');
    const serviceType = kind === 'beauty' ? SUPABASE_SERVICE_TYPES.beautyWellness : SUPABASE_SERVICE_TYPES.education;
    const path = `${serviceType}/${ownerId}/${Date.now()}-${safeName}`;
    return new Promise((resolve, reject) => {
      this.supabase.upload(file, path).subscribe({
        next: () => resolve(this.supabase.publicUrl(path)),
        error: reject
      });
    });
  }

  private toComponent(row: CategoryServiceRow | null | undefined, kind: ServiceKind): any {
    if (!row) return null;
    return {
      id: row.id,
      _id: row.id,
      name: row.name,
      businessName: row.business_name,
      mobile: row.mobile,
      category: row.category,
      additionalSkills: row.additional_skills || [],
      serviceFor: row.service_for,
      homeService: row.home_service,
      teachingMode: row.teaching_mode,
      studentLevel: row.student_level,
      experience: row.experience,
      startingPrice: row.starting_price,
      village: row.village,
      district: row.district,
      description: row.description,
      imageUrl: row.image_url,
      images: row.image_url ? [{ url: row.image_url }] : [],
      image: row.image_url ? [{ url: row.image_url }] : [],
      latitude: row.latitude,
      longitude: row.longitude,
      location: { coordinates: [row.longitude, row.latitude] },
      status: row.status,
      isActive: row.status === 'ACTIVE',
      serviceType: kind,
      createdAt: row.created_at,
      updatedAt: row.updated_at
    };
  }

  private table(kind: ServiceKind): string {
    return kind === 'beauty'
      ? SUPABASE_TABLES.beautyWellnessServices
      : SUPABASE_TABLES.educationServices;
  }

  private requireToken(): string {
    const token = this.auth.getToken();
    if (!token) throw new Error('Please login before posting this service.');
    return token;
  }
}
