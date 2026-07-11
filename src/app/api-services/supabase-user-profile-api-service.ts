import { inject, Injectable } from '@angular/core';
import { Observable, map, of, switchMap } from 'rxjs';
import { AuthService } from '../auth-services/auth-services';
import { SUPABASE_TABLES } from '../constants/supabase.constants';
import { SupabaseClientService } from '../shared-services/supabase-client.service';

@Injectable({ providedIn: 'root' })
export class SupabaseUserProfileApiService {
  private readonly supabase = inject(SupabaseClientService);
  private readonly auth = inject(AuthService);

  get enabled(): boolean {
    return this.supabase.enabled;
  }

  getProfile(): Observable<any> {
    const user = this.auth.getUser();
    if (!user?.id) return of(null);
    return this.supabase.selectWithAuth<any>(SUPABASE_TABLES.profiles, this.requireToken(), {
      filters: { id: user.id },
      limit: 1
    }).pipe(map((rows) => this.toUser(rows[0] || user)));
  }

  updateProfile(data: any): Observable<any> {
    const user = this.auth.getUser();
    const profile = {
      id: user?.id,
      name: data.name || data.userName || '',
      email: data.email || user?.email || '',
      mobile: data.mobile || data.mobileNumber || '',
      about: data.about || ''
    };

    return this.supabase.updateWithAuth<any>(SUPABASE_TABLES.profiles, user?.id, profile, this.requireToken()).pipe(
      map((rows) => {
        const nextUser = {
          id: user?.id,
          name: rows[0]?.name || profile.name,
          email: rows[0]?.email || profile.email,
          mobile: rows[0]?.mobile || profile.mobile
        };
        this.auth.setUser(nextUser as any);
        return this.toUser(rows[0] || profile);
      })
    );
  }

  updatePassword(data: any): Observable<any> {
    const password = data.newPassword || data.password || data.confirmPassword;
    return this.supabase.authPut('user', { password }, this.requireToken()).pipe(map((res) => ({ data: res })));
  }

  getAddress(coords: { latitude: number; longitude: number }): Observable<any> {
    const payload = {
      owner_id: this.auth.getUser()?.id || null,
      latitude: coords.latitude,
      longitude: coords.longitude,
      address: `${coords.latitude}, ${coords.longitude}`
    };

    if (!this.auth.getToken()) {
      return of({ data: payload, address: payload.address });
    }

    return this.supabase.insertWithAuth<any>(SUPABASE_TABLES.userLocations, payload, this.requireToken()).pipe(
      map((rows) => ({ data: rows[0] || payload, address: payload.address }))
    );
  }

  private requireToken(): string {
    const token = this.auth.getToken();
    if (!token) throw new Error('Please login first.');
    return token;
  }

  private toUser(row: any): any {
    return {
      id: row?.id || '',
      name: row?.name || '',
      email: row?.email || '',
      mobile: row?.mobile || '',
      about: row?.about || '',
      subscription: {
        plan: row?.subscription_plan || 'FREE',
        startDate: row?.subscription_start_date || null,
        endDate: row?.subscription_end_date || null
      },
      createdAt: row?.created_at || null,
      updatedAt: row?.updated_at || null
    };
  }
}
