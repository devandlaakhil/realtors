import { inject, Injectable } from '@angular/core';
import { Observable, from, map, switchMap } from 'rxjs';
import { AuthService } from '../auth-services/auth-services';
import { SUPABASE_SERVICE_TYPES, SUPABASE_TABLES } from '../constants/supabase.constants';
import { SupabaseClientService } from '../shared-services/supabase-client.service';
import { isWithinServiceRadius, radiusBoundingBox } from '../shared-services/distance-utils';
import { PostingAccessService } from '../shared-services/posting-access.service';

interface DriverRow {
  id?: string;
  owner_id?: string | null;
  name: string;
  mobile: string;
  whatsapp_number?: string | null;
  vehicle_types: string[];
  licence_type?: string | null;
  licence_number?: string | null;
  experience?: number | null;
  price_per_day?: number | null;
  price_per_trip?: number | null;
  available_for_outstation?: boolean;
  available_at_night?: boolean;
  has_own_vehicle?: boolean;
  village?: string | null;
  district?: string | null;
  state?: string | null;
  languages?: string | null;
  description?: string | null;
  image_url?: string | null;
  latitude?: number | null;
  longitude?: number | null;
  status?: 'ACTIVE' | 'INACTIVE';
  created_at?: string;
  updated_at?: string;
}

@Injectable({ providedIn: 'root' })
export class SupabaseDriverApiService {
  private readonly supabase = inject(SupabaseClientService);
  private readonly auth = inject(AuthService);
  private readonly postingAccess = inject(PostingAccessService);
  private readonly table = SUPABASE_TABLES.drivers;

  get enabled(): boolean {
    return this.supabase.enabled;
  }

  list(params?: any): Observable<{ data: any[] }> {
    return this.supabase.select<DriverRow>(this.table, {
      filters: { status: 'ACTIVE' },
      filterOps: radiusBoundingBox(params),
      order: 'created_at.desc'
    }).pipe(map((rows) => ({
      data: rows
        .filter((row) => isWithinServiceRadius(params, row.latitude, row.longitude))
        .map((row) => this.toComponent(row))
    })));
  }

  mine(): Observable<{ data: any[] }> {
    return this.supabase.selectWithAuth<DriverRow>(this.table, this.requireToken(), {
      filters: { owner_id: this.auth.getUser()?.id },
      order: 'created_at.desc'
    }).pipe(map((rows) => ({ data: rows.map((row) => this.toComponent(row)) })));
  }

  single(id: string): Observable<{ data: any }> {
    return this.supabase.selectWithAuth<DriverRow>(this.table, this.requireToken(), {
      filters: { id },
      limit: 1
    }).pipe(map((rows) => ({ data: this.toComponent(rows[0]) })));
  }

  create(body: FormData): Observable<{ data: any }> {
    return this.postingAccess.assertCanCreatePost().pipe(
      switchMap(() => from(this.formDataToPayload(body))),
      switchMap((payload) => this.supabase.insertWithAuth<DriverRow>(this.table, payload, this.requireToken())),
      map((rows) => ({ data: this.toComponent(rows[0]) }))
    );
  }

  update(body: FormData): Observable<{ data: any }> {
    const id = String(body.get('id') || '');
    return from(this.formDataToPayload(body, false)).pipe(
      switchMap((payload) => this.supabase.updateWithAuth<DriverRow>(this.table, id, payload, this.requireToken())),
      map((rows) => ({ data: this.toComponent(rows[0]) }))
    );
  }

  toggleStatus(id: string): Observable<{ data: any }> {
    return this.single(id).pipe(
      switchMap((res) => this.supabase.updateWithAuth<DriverRow>(
        this.table,
        id,
        { status: res.data?.status === 'ACTIVE' ? 'INACTIVE' : 'ACTIVE' },
        this.requireToken()
      )),
      map((rows) => ({ data: this.toComponent(rows[0]) }))
    );
  }

  delete(id: string): Observable<{ data: any }> {
    return this.supabase.deleteWithAuth<DriverRow>(this.table, id, this.requireToken())
      .pipe(map((rows) => ({ data: this.toComponent(rows[0]) })));
  }

  private async formDataToPayload(body: FormData, forceActive = true): Promise<Partial<DriverRow>> {
    const raw = JSON.parse(String(body.get('payload') || '{}'));
    const ownerId = this.auth.getUser()?.id || null;
    const imageFile = body.get('images');
    let imageUrl = typeof raw.image === 'string' ? raw.image : null;

    if (imageFile instanceof File) imageUrl = await this.uploadImage(imageFile, ownerId || 'guest');

    return {
      owner_id: ownerId,
      name: raw.name || '',
      mobile: raw.mobile || '',
      whatsapp_number: raw.whatsappNumber || '',
      vehicle_types: Array.isArray(raw.vehicleTypes) ? raw.vehicleTypes : [],
      licence_type: raw.licenceType || '',
      licence_number: raw.licenceNumber || '',
      experience: raw.experience ?? 0,
      price_per_day: raw.pricePerDay === '' ? null : Number(raw.pricePerDay),
      price_per_trip: raw.pricePerTrip === '' ? null : Number(raw.pricePerTrip),
      available_for_outstation: !!raw.availableForOutstation,
      available_at_night: !!raw.availableAtNight,
      has_own_vehicle: !!raw.hasOwnVehicle,
      village: raw.village || '',
      district: raw.district || '',
      state: raw.state || '',
      languages: raw.languages || '',
      description: raw.description || '',
      image_url: imageUrl,
      latitude: raw.latitude ?? null,
      longitude: raw.longitude ?? null,
      ...(forceActive ? { status: raw.isActive === false ? 'INACTIVE' as const : 'ACTIVE' as const } : {})
    };
  }

  private uploadImage(file: File, ownerId: string): Promise<string> {
    const safeName = file.name.replace(/[^a-zA-Z0-9._-]/g, '-');
    const path = `${SUPABASE_SERVICE_TYPES.driver}/${ownerId}/${Date.now()}-${safeName}`;
    return new Promise((resolve, reject) => {
      this.supabase.upload(file, path).subscribe({
        next: () => resolve(this.supabase.publicUrl(path)),
        error: reject
      });
    });
  }

  private toComponent(row?: DriverRow | null): any {
    if (!row) return null;
    return {
      id: row.id,
      _id: row.id,
      name: row.name,
      mobile: row.mobile,
      whatsappNumber: row.whatsapp_number,
      vehicleTypes: row.vehicle_types || [],
      licenceType: row.licence_type,
      licenceNumber: row.licence_number,
      experience: row.experience,
      pricePerDay: row.price_per_day,
      pricePerTrip: row.price_per_trip,
      availableForOutstation: row.available_for_outstation,
      availableAtNight: row.available_at_night,
      hasOwnVehicle: row.has_own_vehicle,
      village: row.village,
      district: row.district,
      state: row.state,
      languages: row.languages,
      description: row.description,
      image: row.image_url ? [{ url: row.image_url }] : [],
      imageUrl: row.image_url,
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
    if (!token) throw new Error('Please login before using driver services.');
    return token;
  }
}
