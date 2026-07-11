import { inject, Injectable } from '@angular/core';
import { Observable, from, map, switchMap } from 'rxjs';
import { AuthService } from '../auth-services/auth-services';
import { SUPABASE_SERVICE_TYPES, SUPABASE_TABLES } from '../constants/supabase.constants';
import { SupabaseClientService } from '../shared-services/supabase-client.service';
import { distanceKm, isWithinServiceRadius } from '../shared-services/distance-utils';
import { PostingAccessService } from '../shared-services/posting-access.service';

interface CommercialVehicleRow {
  id?: string;
  owner_id?: string | null;
  owner_name: string;
  mobile_number: string;
  whatsapp_number?: string | null;
  vehicle_type: string;
  title: string;
  brand?: string | null;
  model?: string | null;
  horse_power?: number | null;
  manufacturing_year?: number | null;
  registration_number?: string | null;
  price_per_hour?: number | null;
  price_per_acre?: number | null;
  minimum_booking_hours?: number | null;
  address?: string | null;
  village?: string | null;
  mandal?: string | null;
  district?: string | null;
  state?: string | null;
  pincode?: string | null;
  includes_driver?: boolean;
  fuel_included?: boolean;
  rotavator_available?: boolean;
  cultivator_available?: boolean;
  trailer_available?: boolean;
  is_available?: boolean;
  available_from?: string | null;
  available_to?: string | null;
  description?: string | null;
  images?: string[];
  latitude?: number | null;
  longitude?: number | null;
  status?: 'ACTIVE' | 'INACTIVE';
  created_at?: string;
  updated_at?: string;
}

@Injectable({ providedIn: 'root' })
export class SupabaseCommercialVehicleApiService {
  private readonly supabase = inject(SupabaseClientService);
  private readonly auth = inject(AuthService);
  private readonly postingAccess = inject(PostingAccessService);
  private readonly table = SUPABASE_TABLES.commercialVehicles;

  get enabled(): boolean {
    return this.supabase.enabled;
  }

  list(params?: any): Observable<{ data: any[]; count: number }> {
    return this.supabase.select<CommercialVehicleRow>(this.table, {
      filters: { status: 'ACTIVE' },
      order: 'created_at.desc'
    }).pipe(map((rows) => {
      const data = rows
        .filter((row) => isWithinServiceRadius(params, row.latitude, row.longitude))
        .map((row) => this.toComponent(row, params));
      return { data, count: data.length };
    }));
  }

  mine(): Observable<{ data: any[] }> {
    return this.supabase.selectWithAuth<CommercialVehicleRow>(this.table, this.requireToken(), {
      filters: { owner_id: this.auth.getUser()?.id },
      order: 'created_at.desc'
    }).pipe(map((rows) => ({ data: rows.map((row) => this.toComponent(row)) })));
  }

  single(id: string): Observable<{ data: any[] }> {
    return this.supabase.selectWithAuth<CommercialVehicleRow>(this.table, this.requireToken(), {
      filters: { id },
      limit: 1
    }).pipe(map((rows) => ({ data: rows.map((row) => this.toComponent(row)) })));
  }

  create(body: FormData): Observable<{ data: any }> {
    return this.postingAccess.assertCanCreatePost().pipe(
      switchMap(() => from(this.formDataToPayload(body))),
      switchMap((payload) => this.supabase.insertWithAuth<CommercialVehicleRow>(this.table, payload, this.requireToken())),
      map((rows) => ({ data: this.toComponent(rows[0]) }))
    );
  }

  update(body: FormData): Observable<{ data: any }> {
    const id = String(body.get('id') || '');
    return from(this.formDataToPayload(body, false)).pipe(
      switchMap((payload) => this.supabase.updateWithAuth<CommercialVehicleRow>(this.table, id, payload, this.requireToken())),
      map((rows) => ({ data: this.toComponent(rows[0]) }))
    );
  }

  toggleStatus(id: string): Observable<{ data: any }> {
    return this.single(id).pipe(
      switchMap((res) => {
        const item = res.data?.[0];
        const active = item?.status === 'ACTIVE' || item?.isAvailable !== false;
        return this.supabase.updateWithAuth<CommercialVehicleRow>(
          this.table,
          id,
          { status: active ? 'INACTIVE' : 'ACTIVE', is_available: !active },
          this.requireToken()
        );
      }),
      map((rows) => ({ data: this.toComponent(rows[0]) }))
    );
  }

  delete(id: string): Observable<{ data: any }> {
    return this.supabase.deleteWithAuth<CommercialVehicleRow>(this.table, id, this.requireToken())
      .pipe(map((rows) => ({ data: this.toComponent(rows[0]) })));
  }

  private async formDataToPayload(body: FormData, forceActive = true): Promise<Partial<CommercialVehicleRow>> {
    const raw = JSON.parse(String(body.get('payload') || '{}'));
    const owner = raw.ownerDetails || {};
    const vehicle = raw.tractorDetails || {};
    const pricing = raw.pricing || {};
    const location = raw.location || {};
    const features = raw.features || {};
    const availability = raw.availability || {};
    const ownerId = this.auth.getUser()?.id || null;
    const existingImages = JSON.parse(String(body.get('existingImages') || '[]'));
    const imageUrls: string[] = Array.isArray(existingImages)
      ? existingImages.map((img: any) => typeof img === 'string' ? img : img?.url).filter(Boolean)
      : [];

    const uploads: Promise<string>[] = [];
    body.forEach((value) => {
      if (value instanceof File) uploads.push(this.uploadImage(value, ownerId || 'guest'));
    });
    imageUrls.push(...await Promise.all(uploads));

    const coordinates = location.geoLocation?.coordinates || [];
    const lng = Number(location.longitude ?? coordinates[0]);
    const lat = Number(location.latitude ?? coordinates[1]);

    return {
      owner_id: ownerId,
      owner_name: owner.ownerName || '',
      mobile_number: owner.mobileNumber || '',
      whatsapp_number: owner.whatsappNumber || '',
      vehicle_type: vehicle.vehicleType || 'Tractor',
      title: vehicle.title || '',
      brand: vehicle.brand || '',
      model: vehicle.model || '',
      horse_power: vehicle.horsePower === '' ? null : Number(vehicle.horsePower),
      manufacturing_year: vehicle.manufacturingYear === '' ? null : Number(vehicle.manufacturingYear),
      registration_number: vehicle.registrationNumber || '',
      price_per_hour: pricing.pricePerHour === '' ? null : Number(pricing.pricePerHour),
      price_per_acre: pricing.pricePerAcre === '' ? null : Number(pricing.pricePerAcre),
      minimum_booking_hours: pricing.minimumBookingHours === '' ? null : Number(pricing.minimumBookingHours),
      address: location.address || '',
      village: location.village || '',
      mandal: location.mandal || '',
      district: location.district || '',
      state: location.state || '',
      pincode: location.pincode || '',
      includes_driver: !!features.includesDriver,
      fuel_included: !!features.fuelIncluded,
      rotavator_available: !!features.rotavatorAvailable,
      cultivator_available: !!features.cultivatorAvailable,
      trailer_available: !!features.trailerAvailable,
      is_available: availability.isAvailable !== false,
      available_from: availability.availableFrom || null,
      available_to: availability.availableTo || null,
      description: raw.description || '',
      images: imageUrls,
      latitude: Number.isFinite(lat) ? lat : null,
      longitude: Number.isFinite(lng) ? lng : null,
      ...(forceActive ? { status: availability.isAvailable === false ? 'INACTIVE' as const : 'ACTIVE' as const } : {})
    };
  }

  private uploadImage(file: File, ownerId: string): Promise<string> {
    const safeName = file.name.replace(/[^a-zA-Z0-9._-]/g, '-');
    const path = `${SUPABASE_SERVICE_TYPES.commercialVehicle}/${ownerId}/${Date.now()}-${safeName}`;
    return new Promise((resolve, reject) => {
      this.supabase.upload(file, path).subscribe({
        next: () => resolve(this.supabase.publicUrl(path)),
        error: reject
      });
    });
  }

  private toComponent(row?: CommercialVehicleRow | null, params?: any): any {
    if (!row) return null;
    const providerDistanceKm = distanceKm(params?.lat, params?.lng, row.latitude, row.longitude);
    return {
      id: row.id,
      _id: row.id,
      ownerName: row.owner_name,
      mobileNumber: row.mobile_number,
      whatsappNumber: row.whatsapp_number,
      vehicleType: row.vehicle_type,
      title: row.title,
      brand: row.brand,
      model: row.model,
      horsePower: row.horse_power,
      manufacturingYear: row.manufacturing_year,
      registrationNumber: row.registration_number,
      pricePerHour: row.price_per_hour,
      pricePerAcre: row.price_per_acre,
      minimumBookingHours: row.minimum_booking_hours,
      location: {
        address: row.address,
        village: row.village,
        mandal: row.mandal,
        district: row.district,
        state: row.state,
        pincode: row.pincode,
        coordinates: {
          type: 'Point',
          coordinates: [row.longitude, row.latitude]
        }
      },
      includesDriver: row.includes_driver,
      fuelIncluded: row.fuel_included,
      rotavatorAvailable: row.rotavator_available,
      cultivatorAvailable: row.cultivator_available,
      trailerAvailable: row.trailer_available,
      isAvailable: row.status ? row.status === 'ACTIVE' : row.is_available !== false,
      availableFrom: row.available_from,
      availableTo: row.available_to,
      description: row.description,
      images: (row.images || []).map((url) => ({ url })),
      status: row.status,
      averageRating: 0,
      distanceKm: providerDistanceKm == null ? 0 : Number(providerDistanceKm.toFixed(1)),
      createdAt: row.created_at,
      updatedAt: row.updated_at
    };
  }

  private requireToken(): string {
    const token = this.auth.getToken();
    if (!token) throw new Error('Please login before using commercial vehicle services.');
    return token;
  }
}
