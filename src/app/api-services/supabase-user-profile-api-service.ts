import { inject, Injectable } from '@angular/core';
import { catchError, forkJoin, map, Observable, of, switchMap } from 'rxjs';
import { AuthService } from '../auth-services/auth-services';
import { SUPABASE_TABLES } from '../constants/supabase.constants';
import { SupabaseClientService } from '../shared-services/supabase-client.service';

@Injectable({ providedIn: 'root' })
export class SupabaseUserProfileApiService {
  private readonly supabase = inject(SupabaseClientService);
  private readonly auth = inject(AuthService);
  private extrasCache = new Map<string, { at: number; value: { propertiesCount: number; servicesCount: number; latestPayment: any | null } }>();
  private readonly extrasCacheMs = 30000;
  private readonly serviceTables = [
    SUPABASE_TABLES.homeRepairServices,
    SUPABASE_TABLES.skilledWorkers,
    SUPABASE_TABLES.beautyWellnessServices,
    SUPABASE_TABLES.educationServices,
    SUPABASE_TABLES.transportVehicles,
    SUPABASE_TABLES.commercialVehicles,
    SUPABASE_TABLES.drivers,
    SUPABASE_TABLES.dynamicServicePosts,
  ];

  get enabled(): boolean {
    return this.supabase.enabled;
  }

  getProfile(): Observable<any> {
    const user = this.auth.getUser();
    if (!user?.id) return of(null);
    return this.supabase.selectWithAuth<any>(SUPABASE_TABLES.profiles, this.requireToken(), {
      filters: { id: user.id },
      limit: 1
    }).pipe(
      switchMap((rows) => this.profileExtras(user.id).pipe(
        map((extras) => this.toUser(rows[0] || user, extras))
      ))
    );
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

  private profileExtras(userId: string): Observable<{ propertiesCount: number; servicesCount: number; latestPayment: any | null }> {
    const cached = this.extrasCache.get(userId);
    if (cached && Date.now() - cached.at < this.extrasCacheMs) {
      return of(cached.value);
    }

    const serviceCounts = this.serviceTables.map((table) => this.countRows(table, userId));
    return forkJoin({
      propertiesCount: this.countRows(SUPABASE_TABLES.servicePosts, userId),
      serviceCounts: forkJoin(serviceCounts),
      payments: this.supabase.selectWithAuth<any>(SUPABASE_TABLES.payments, this.requireToken(), {
        filters: { userid: userId, status: 'SUCCESS' },
        order: 'created_at.desc',
        limit: 1
      }).pipe(catchError(() => of([])))
    }).pipe(map(({ propertiesCount, serviceCounts, payments }) => {
      const value = {
        propertiesCount,
        servicesCount: serviceCounts.reduce((sum, count) => sum + count, 0),
        latestPayment: payments[0] || null
      };
      this.extrasCache.set(userId, { at: Date.now(), value });
      return value;
    }));
  }

  private countRows(table: string, userId: string): Observable<number> {
    return this.supabase.selectWithAuth<{ id: string }>(table, this.requireToken(), {
      select: 'id',
      filters: { owner_id: userId }
    }).pipe(
      map((rows) => rows.length),
      catchError(() => of(0))
    );
  }

  private toUser(row: any, extras: { propertiesCount?: number; servicesCount?: number; latestPayment?: any | null } = {}): any {
    const latestPayment = extras.latestPayment;
    const subscriptionPlan = row?.subscription_plan || latestPayment?.plan || 'FREE';
    const subscriptionStart = row?.subscription_start_date || latestPayment?.subscription_start_date || null;
    const subscriptionEnd = row?.subscription_end_date || latestPayment?.subscription_end_date || latestPayment?.expires_at || null;

    return {
      id: row?.id || '',
      name: row?.name || '',
      email: row?.email || '',
      mobile: row?.mobile || '',
      about: row?.about || '',
      subscription: {
        plan: subscriptionPlan,
        startDate: subscriptionStart,
        endDate: subscriptionEnd
      },
      propertiesCount: extras.propertiesCount || 0,
      servicesCount: extras.servicesCount || 0,
      lastChangedDays: this.daysSince(row?.updated_at || row?.created_at),
      latestPayment,
      createdAt: row?.created_at || null,
      updatedAt: row?.updated_at || null
    };
  }

  private daysSince(dateValue: string | null | undefined): number {
    if (!dateValue) return 0;
    const time = new Date(dateValue).getTime();
    if (!Number.isFinite(time)) return 0;
    return Math.max(0, Math.floor((Date.now() - time) / 86400000));
  }
}
