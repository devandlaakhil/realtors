import { inject, Injectable } from '@angular/core';
import { catchError, forkJoin, map, Observable, of, switchMap, throwError } from 'rxjs';
import { AuthService } from '../auth-services/auth-services';
import { SUPABASE_TABLES } from '../constants/supabase.constants';
import { SupabaseClientService } from './supabase-client.service';

interface ProfileSubscription {
  id?: string;
  subscription_plan?: string | null;
  subscription_start_date?: string | null;
  subscription_end_date?: string | null;
  created_at?: string | null;
}

interface RefreshTokenResponse {
  access_token?: string;
  refresh_token?: string;
}

@Injectable({ providedIn: 'root' })
export class PostingAccessService {
  private readonly auth = inject(AuthService);
  private readonly supabase = inject(SupabaseClientService);
  private cachedOwnerId = '';
  private cachedPostCount = 0;
  private cachedPostCountAt = 0;
  private readonly cacheMs = 15000;

  private readonly postTables = [
    SUPABASE_TABLES.servicePosts,
    SUPABASE_TABLES.homeRepairServices,
    SUPABASE_TABLES.skilledWorkers,
    SUPABASE_TABLES.beautyWellnessServices,
    SUPABASE_TABLES.educationServices,
    SUPABASE_TABLES.transportVehicles,
    SUPABASE_TABLES.commercialVehicles,
    SUPABASE_TABLES.drivers,
    SUPABASE_TABLES.dynamicServicePosts,
    SUPABASE_TABLES.advertisements,
  ];

  assertCanCreatePost(): Observable<void> {
    const ownerId = this.auth.getUser()?.id;

    if (!ownerId) {
      return throwError(() => new Error('Please login before posting.'));
    }

    return this.getFreshAccessToken().pipe(
      switchMap((token) => this.getProfile(token, ownerId).pipe(map((profile) => ({ token, profile })))),
      switchMap((profile) => {
        if (this.hasActivePaidPlan(profile.profile)) return of(undefined);

        if (!this.isInsideFreeMonth(profile.profile)) {
          return throwError(() => new Error('Your free posting period is over. Please subscribe to continue posting.'));
        }

        return this.getTotalPostCount(profile.token, ownerId).pipe(
          switchMap((count) => count < 1
            ? of(undefined)
            : throwError(() => new Error('Free users can publish only one post. Please subscribe for unlimited posts.'))
          )
        );
      })
    );
  }

  private getFreshAccessToken(): Observable<string> {
    const token = this.auth.getToken();
    if (!token) return throwError(() => new Error('Please login before posting.'));
    if (!this.isJwtExpired(token)) return of(token);

    const refreshToken = this.auth.getRefreshToken();
    if (!refreshToken) {
      this.auth.logout();
      return throwError(() => new Error('Your login session expired. Please login again.'));
    }

    return this.supabase.authPost<RefreshTokenResponse>('token?grant_type=refresh_token', {
      refresh_token: refreshToken
    }).pipe(
      map((response) => {
        if (!response.access_token) {
          throw new Error('Your login session expired. Please login again.');
        }
        this.auth.logIn(response.access_token);
        this.auth.setRefreshToken(response.refresh_token || refreshToken);
        return response.access_token;
      }),
      catchError((error) => {
        this.auth.logout();
        return throwError(() => error?.message
          ? error
          : new Error('Your login session expired. Please login again.'));
      })
    );
  }

  private isJwtExpired(token: string): boolean {
    try {
      const payload = JSON.parse(atob(token.split('.')[1] || ''));
      const expiresAt = Number(payload.exp || 0) * 1000;
      return !expiresAt || expiresAt <= Date.now() + 30000;
    } catch {
      return true;
    }
  }

  private getProfile(token: string, ownerId: string): Observable<ProfileSubscription | null> {
    return this.supabase.selectWithAuth<ProfileSubscription>(SUPABASE_TABLES.profiles, token, {
      filters: { id: ownerId },
      limit: 1
    }).pipe(
      map((rows) => rows[0] || null),
      catchError(() => of(null))
    );
  }

  private getTotalPostCount(token: string, ownerId: string): Observable<number> {
    if (this.cachedOwnerId === ownerId && Date.now() - this.cachedPostCountAt < this.cacheMs) {
      return of(this.cachedPostCount);
    }

    const requests = this.postTables.map((table) =>
      this.supabase.selectWithAuth<{ id: string }>(table, token, {
        select: 'id',
        filters: { owner_id: ownerId }
      }).pipe(
        map((rows) => rows.length),
        catchError(() => of(0))
      )
    );

    return forkJoin(requests).pipe(map((counts) => {
      const total = counts.reduce((sum, count) => sum + count, 0);
      this.cachedOwnerId = ownerId;
      this.cachedPostCount = total;
      this.cachedPostCountAt = Date.now();
      return total;
    }));
  }

  private hasActivePaidPlan(profile: ProfileSubscription | null): boolean {
    const plan = profile?.subscription_plan || 'FREE';
    const endDate = profile?.subscription_end_date ? new Date(profile.subscription_end_date) : null;
    return plan !== 'FREE' && (!endDate || endDate.getTime() >= Date.now());
  }

  private isInsideFreeMonth(profile: ProfileSubscription | null): boolean {
    const start = profile?.created_at ? new Date(profile.created_at) : new Date();
    const freeEnd = new Date(start);
    freeEnd.setMonth(freeEnd.getMonth() + 1);
    return freeEnd.getTime() >= Date.now();
  }
}
