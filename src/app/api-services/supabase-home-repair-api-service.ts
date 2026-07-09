import { inject, Injectable } from '@angular/core';
import { Observable, from, map, switchMap } from 'rxjs';
import { AuthService } from '../auth-services/auth-services';
import { SUPABASE_SERVICE_TYPES, SUPABASE_TABLES } from '../constants/supabase.constants';
import { SupabaseClientService } from '../shared-services/supabase-client.service';

export interface SupabaseHomeRepairService {
  id?: string;
  owner_id?: string | null;
  shop_name: string;
  owner_name: string;
  mobile: string;
  address: string;
  village?: string | null;
  district?: string | null;
  products: string[];
  opening_time?: string | null;
  closing_time?: string | null;
  home_delivery?: boolean;
  description?: string | null;
  image_url?: string | null;
  latitude?: number | null;
  longitude?: number | null;
  status?: 'ACTIVE' | 'INACTIVE';
  created_at?: string;
  updated_at?: string;
}

@Injectable({ providedIn: 'root' })
export class SupabaseHomeRepairApiService {
  private readonly supabase = inject(SupabaseClientService);
  private readonly auth = inject(AuthService);
  private readonly table = SUPABASE_TABLES.homeRepairServices;

  get enabled(): boolean {
    return this.supabase.enabled;
  }

  getNearby(params?: { lat?: number; lng?: number; repairType?: string }): Observable<{ data: any[] }> {
    return this.supabase.select<SupabaseHomeRepairService>(this.table, {
      filters: { status: 'ACTIVE' },
      order: 'created_at.desc'
    }).pipe(
      map((rows) => rows
        .filter((row) => !params?.repairType || (row.products || []).includes(params.repairType))
        .map((row) => this.toComponentShop(row))
      ),
      map((data) => ({ data }))
    );
  }

  create(body: FormData): Observable<{ data: any }> {
    return from(this.formDataToPayload(body)).pipe(
      switchMap((payload) => this.supabase.insertWithAuth<SupabaseHomeRepairService>(
        this.table,
        payload,
        this.requireToken()
      )),
      map((rows) => ({ data: this.toComponentShop(rows[0]) }))
    );
  }

  getMyShops(): Observable<{ data: any[] }> {
    return this.supabase.selectWithAuth<SupabaseHomeRepairService>(this.table, this.requireToken(), {
      filters: { owner_id: this.auth.getUser()?.id },
      order: 'created_at.desc'
    }).pipe(map((rows) => ({ data: rows.map((row) => this.toComponentShop(row)) })));
  }

  getSingle(id: string): Observable<{ data: any }> {
    return this.supabase.selectWithAuth<SupabaseHomeRepairService>(this.table, this.requireToken(), {
      filters: { id },
      limit: 1
    }).pipe(map((rows) => ({ data: this.toComponentShop(rows[0]) })));
  }

  update(body: FormData): Observable<{ data: any }> {
    const id = String(body.get('id') || '');
    return from(this.formDataToPayload(body, false)).pipe(
      switchMap((payload) => this.supabase.updateWithAuth<SupabaseHomeRepairService>(
        this.table,
        id,
        payload,
        this.requireToken()
      )),
      map((rows) => ({ data: this.toComponentShop(rows[0]) }))
    );
  }

  updateStatus(id: string): Observable<{ data: any }> {
    return this.getSingle(id).pipe(
      switchMap((res) => {
        const isActive = res.data?.status === 'ACTIVE' || res.data?.isActive !== false;
        return this.supabase.updateWithAuth<SupabaseHomeRepairService>(
          this.table,
          id,
          { status: isActive ? 'INACTIVE' : 'ACTIVE' },
          this.requireToken()
        );
      }),
      map((rows) => ({ data: this.toComponentShop(rows[0]) }))
    );
  }

  deleteShop(id: string): Observable<{ data: any }> {
    return this.supabase.deleteWithAuth<SupabaseHomeRepairService>(this.table, id, this.requireToken())
      .pipe(map((rows) => ({ data: this.toComponentShop(rows[0]) })));
  }

  private async formDataToPayload(body: FormData, forceActive = true): Promise<Partial<SupabaseHomeRepairService>> {
    const raw = JSON.parse(String(body.get('payload') || '{}'));
    const imageFile = body.get('images');
    const ownerId = this.auth.getUser()?.id || null;
    let imageUrl = typeof raw.image === 'string' ? raw.image : null;

    if (imageFile instanceof File) {
      imageUrl = await this.uploadImage(imageFile, ownerId || 'guest');
    }

    return {
      owner_id: ownerId,
      shop_name: raw.shopName || raw.name || '',
      owner_name: raw.ownerName || '',
      mobile: raw.mobile || '',
      address: raw.address || '',
      village: raw.village || '',
      district: raw.district || '',
      products: Array.isArray(raw.products) ? raw.products : [],
      opening_time: raw.openingTime || '08:00',
      closing_time: raw.closingTime || '20:00',
      home_delivery: !!raw.homeDelivery,
      description: raw.description || '',
      image_url: imageUrl,
      latitude: raw.latitude ?? null,
      longitude: raw.longitude ?? null,
      ...(forceActive ? { status: 'ACTIVE' as const } : {})
    };
  }

  private uploadImage(file: File, ownerId: string): Promise<string> {
    const safeName = file.name.replace(/[^a-zA-Z0-9._-]/g, '-');
    const path = `${SUPABASE_SERVICE_TYPES.homeRepair}/${ownerId}/${Date.now()}-${safeName}`;
    return new Promise((resolve, reject) => {
      this.supabase.upload(file, path).subscribe({
        next: () => resolve(this.supabase.publicUrl(path)),
        error: reject
      });
    });
  }

  private toComponentShop(row?: SupabaseHomeRepairService | null): any {
    if (!row) return null;
    return {
      id: row.id,
      _id: row.id,
      shopName: row.shop_name,
      name: row.shop_name,
      ownerName: row.owner_name,
      mobile: row.mobile,
      address: row.address,
      village: row.village,
      district: row.district,
      products: row.products || [],
      categories: row.products || [],
      openingTime: row.opening_time,
      closingTime: row.closing_time,
      homeDelivery: row.home_delivery,
      description: row.description,
      imageUrl: row.image_url,
      image: row.image_url ? { url: row.image_url } : null,
      images: row.image_url ? [{ url: row.image_url }] : [],
      latitude: row.latitude,
      longitude: row.longitude,
      location: {
        village: row.village,
        district: row.district,
        coordinates: [row.longitude, row.latitude]
      },
      status: row.status,
      isActive: row.status === 'ACTIVE',
      createdAt: row.created_at,
      updatedAt: row.updated_at
    };
  }

  private requireToken(): string {
    const token = this.auth.getToken();
    if (!token) throw new Error('Please login before using home repair services.');
    return token;
  }
}
