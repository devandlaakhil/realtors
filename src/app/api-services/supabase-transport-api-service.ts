import { inject, Injectable } from '@angular/core';
import { Observable, from, map, switchMap } from 'rxjs';
import { AuthService } from '../auth-services/auth-services';
import { SUPABASE_SERVICE_TYPES, SUPABASE_TABLES } from '../constants/supabase.constants';
import { SupabaseClientService } from '../shared-services/supabase-client.service';

interface TransportVehicleRow {
  id?: string;
  owner_id?: string | null;
  name: string;
  mobile: string;
  vehicle_type?: string | null;
  vehicle_number?: string | null;
  capacity?: string | null;
  capacity_unit?: string | null;
  material_types?: string[];
  price?: number | null;
  pricing_type?: string | null;
  availability?: string | null;
  village?: string | null;
  district?: string | null;
  state?: string | null;
  pincode?: string | null;
  facilities?: string[];
  description?: string | null;
  image_url?: string | null;
  verified?: boolean;
  active?: boolean;
  latitude?: number | null;
  longitude?: number | null;
  status?: 'ACTIVE' | 'INACTIVE';
  created_at?: string;
  updated_at?: string;
}

@Injectable({ providedIn: 'root' })
export class SupabaseTransportApiService {
  private readonly supabase = inject(SupabaseClientService);
  private readonly auth = inject(AuthService);
  private readonly table = SUPABASE_TABLES.transportVehicles;

  get enabled(): boolean {
    return this.supabase.enabled;
  }

  list(params?: any): Observable<{ data: any[] }> {
    return this.supabase.select<TransportVehicleRow>(this.table, {
      filters: { status: 'ACTIVE' },
      order: 'created_at.desc'
    }).pipe(map((rows) => ({ data: rows.map((row) => this.toComponentVehicle(row)) })));
  }

  mine(): Observable<{ data: any[] }> {
    return this.supabase.selectWithAuth<TransportVehicleRow>(this.table, this.requireToken(), {
      filters: { owner_id: this.auth.getUser()?.id },
      order: 'created_at.desc'
    }).pipe(map((rows) => ({ data: rows.map((row) => this.toComponentVehicle(row)) })));
  }

  single(id: string): Observable<{ data: any }> {
    return this.supabase.selectWithAuth<TransportVehicleRow>(this.table, this.requireToken(), {
      filters: { id },
      limit: 1
    }).pipe(map((rows) => ({ data: this.toComponentVehicle(rows[0]) })));
  }

  create(body: FormData): Observable<{ data: any }> {
    return from(this.formDataToPayload(body)).pipe(
      switchMap((payload) => this.supabase.insertWithAuth<TransportVehicleRow>(
        this.table,
        payload,
        this.requireToken()
      )),
      map((rows) => ({ data: this.toComponentVehicle(rows[0]) }))
    );
  }

  update(body: FormData): Observable<{ data: any }> {
    const id = String(body.get('id') || '');
    return from(this.formDataToPayload(body, false)).pipe(
      switchMap((payload) => this.supabase.updateWithAuth<TransportVehicleRow>(
        this.table,
        id,
        payload,
        this.requireToken()
      )),
      map((rows) => ({ data: this.toComponentVehicle(rows[0]) }))
    );
  }

  toggleStatus(id: string): Observable<{ data: any }> {
    return this.single(id).pipe(
      switchMap((res) => {
        const active = res.data?.status === 'ACTIVE' || res.data?.active !== false;
        return this.supabase.updateWithAuth<TransportVehicleRow>(
          this.table,
          id,
          { status: active ? 'INACTIVE' : 'ACTIVE', active: !active },
          this.requireToken()
        );
      }),
      map((rows) => ({ data: this.toComponentVehicle(rows[0]) }))
    );
  }

  delete(id: string): Observable<{ data: any }> {
    return this.supabase.deleteWithAuth<TransportVehicleRow>(this.table, id, this.requireToken())
      .pipe(map((rows) => ({ data: this.toComponentVehicle(rows[0]) })));
  }

  private async formDataToPayload(body: FormData, forceActive = true): Promise<Partial<TransportVehicleRow>> {
    const raw = JSON.parse(String(body.get('payload') || '{}'));
    const coords = raw.location?.coordinates || [];
    const lng = Number(coords[0] ?? raw.longitude ?? 0);
    const lat = Number(coords[1] ?? raw.latitude ?? 0);
    const ownerId = this.auth.getUser()?.id || null;
    const imageFile = body.get('images');
    let imageUrl = typeof raw.images === 'string' ? raw.images : null;

    if (imageFile instanceof File) {
      imageUrl = await this.uploadImage(imageFile, ownerId || 'guest');
    }

    const active = raw.active !== false;
    return {
      owner_id: ownerId,
      name: raw.name || '',
      mobile: raw.mobile || '',
      vehicle_type: raw.vehicleType || '',
      vehicle_number: raw.vehicleNumber || '',
      capacity: raw.capacity || '',
      capacity_unit: raw.capacityUnit || 'Tons',
      material_types: Array.isArray(raw.materialTypes) ? raw.materialTypes : [],
      price: raw.price === '' ? null : Number(raw.price),
      pricing_type: raw.pricingType || 'Per Trip',
      availability: raw.availability || 'Available Now',
      village: raw.village || '',
      district: raw.district || '',
      state: raw.state || '',
      pincode: raw.pincode || '',
      facilities: Array.isArray(raw.facilities) ? raw.facilities : [],
      description: raw.description || '',
      image_url: imageUrl,
      verified: !!raw.verified,
      active,
      latitude: Number.isFinite(lat) ? lat : null,
      longitude: Number.isFinite(lng) ? lng : null,
      ...(forceActive ? { status: active ? 'ACTIVE' as const : 'INACTIVE' as const } : {})
    };
  }

  private uploadImage(file: File, ownerId: string): Promise<string> {
    const safeName = file.name.replace(/[^a-zA-Z0-9._-]/g, '-');
    const path = `${SUPABASE_SERVICE_TYPES.transport}/${ownerId}/${Date.now()}-${safeName}`;
    return new Promise((resolve, reject) => {
      this.supabase.upload(file, path).subscribe({
        next: () => resolve(this.supabase.publicUrl(path)),
        error: reject
      });
    });
  }

  private toComponentVehicle(row?: TransportVehicleRow | null): any {
    if (!row) return null;
    return {
      id: row.id,
      _id: row.id,
      name: row.name,
      mobile: row.mobile,
      vehicleType: row.vehicle_type,
      vehicleNumber: row.vehicle_number,
      capacity: row.capacity,
      capacityUnit: row.capacity_unit,
      materialTypes: row.material_types || [],
      price: row.price,
      pricingType: row.pricing_type,
      availability: row.availability,
      village: row.village,
      district: row.district,
      state: row.state,
      pincode: row.pincode,
      facilities: row.facilities || [],
      description: row.description,
      verified: row.verified,
      active: row.status ? row.status === 'ACTIVE' : row.active !== false,
      images: row.image_url ? [{ url: row.image_url }] : [],
      imageUrl: row.image_url,
      location: {
        type: 'Point',
        coordinates: [row.longitude, row.latitude]
      },
      latitude: row.latitude,
      longitude: row.longitude,
      status: row.status,
      category: row.vehicle_type || 'Vehicle',
      role: row.availability || '',
      skills: row.material_types || [],
      createdAt: row.created_at,
      updatedAt: row.updated_at
    };
  }

  private requireToken(): string {
    const token = this.auth.getToken();
    if (!token) throw new Error('Please login before using vehicle services.');
    return token;
  }
}
