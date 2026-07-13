import { inject, Injectable } from '@angular/core';
import { Observable, from, map, switchMap } from 'rxjs';
import { AuthService } from '../auth-services/auth-services';
import { SUPABASE_TABLES } from '../constants/supabase.constants';
import { SupabaseClientService } from '../shared-services/supabase-client.service';
import { PostingAccessService } from '../shared-services/posting-access.service';

@Injectable({ providedIn: 'root' })
export class SupabaseAdvertisementApiService {
  private readonly supabase = inject(SupabaseClientService);
  private readonly auth = inject(AuthService);
  private readonly postingAccess = inject(PostingAccessService);
  private readonly table = SUPABASE_TABLES.advertisements;

  get enabled(): boolean {
    return this.supabase.enabled;
  }

  listActive(params?: any): Observable<{ data: any[] }> {
    return this.supabase.select<any>(this.table, {
      filters: { status: 'ACTIVE' },
      order: 'created_at.desc'
    }).pipe(map((rows) => ({ data: rows.map((row) => this.toComponent(row)) })));
  }

  create(body: FormData): Observable<{ data: any }> {
    return this.postingAccess.assertCanCreatePost().pipe(
      switchMap(() => from(this.formDataToPayload(body))),
      switchMap((payload) => this.supabase.insertWithAuth<any>(this.table, payload, this.requireToken())),
      map((rows) => ({ data: this.toComponent(rows[0]) }))
    );
  }

  private async formDataToPayload(body: FormData): Promise<any> {
    const raw = JSON.parse(String(body.get('payload') || '{}'));
    const media = body.get('media');
    let mediaUrl = raw.targetLink || '';

    if (media instanceof File) {
      const safeName = media.name.replace(/[^a-zA-Z0-9._-]/g, '-');
      const path = `advertisements/${this.auth.getUser()?.id || 'guest'}/${Date.now()}-${safeName}`;
      await new Promise<void>((resolve, reject) => {
        this.supabase.upload(media, path).subscribe({ next: () => resolve(), error: reject });
      });
      mediaUrl = this.supabase.publicUrl(path);
    }

    return {
      owner_id: this.auth.getUser()?.id || null,
      title: raw.title || '',
      ad_type: raw.adType || 'photo',
      target_link: raw.targetLink || '',
      notes: raw.notes || '',
      media_url: mediaUrl,
      paid_amount: raw.paidAmount || 0,
      payment_payload: raw.paymentReference || {},
      latitude: raw.location?.lat ?? null,
      longitude: raw.location?.lng ?? null,
      status: 'ACTIVE'
    };
  }

  private toComponent(row: any): any {
    return {
      id: row.id,
      _id: row.id,
      title: row.title,
      adType: row.ad_type,
      targetLink: row.target_link,
      notes: row.notes,
      mediaUrl: row.media_url,
      imageUrl: row.media_url,
      videoUrl: row.ad_type === 'video' ? row.media_url : '',
      paidAmount: row.paid_amount,
      payment: row.payment_payload,
      latitude: row.latitude,
      longitude: row.longitude,
      status: row.status,
      createdAt: row.created_at
    };
  }

  private requireToken(): string {
    const token = this.auth.getToken();
    if (!token) throw new Error('Please login before posting an advertisement.');
    return token;
  }
}
