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

@Injectable({ providedIn: 'root' })
export class PostingAccessService {
  private readonly auth = inject(AuthService);
  private readonly supabase = inject(SupabaseClientService);

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
    const token = this.auth.getToken();
    const ownerId = this.auth.getUser()?.id;

    if (!token || !ownerId) {
      return throwError(() => new Error('Please login before posting.'));
    }

    return this.getProfile(token, ownerId).pipe(
      switchMap((profile) => {
        if (this.hasActivePaidPlan(profile)) return of(undefined);

        if (!this.isInsideFreeMonth(profile)) {
          return throwError(() => new Error('Your free posting period is over. Please subscribe to continue posting.'));
        }

        return this.getTotalPostCount(token, ownerId).pipe(
          switchMap((count) => count < 1
            ? of(undefined)
            : throwError(() => new Error('Free users can publish only one post. Please subscribe for unlimited posts.'))
          )
        );
      })
    );
  }

  private getProfile(token: string, ownerId: string): Observable<ProfileSubscription | null> {
    return this.supabase.selectWithAuth<ProfileSubscription>(SUPABASE_TABLES.profiles, token, {
      filters: { id: ownerId },
      limit: 1
    }).pipe(map((rows) => rows[0] || null));
  }

  private getTotalPostCount(token: string, ownerId: string): Observable<number> {
    const requests = this.postTables.map((table) =>
      this.supabase.selectWithAuth<{ id: string }>(table, token, {
        select: 'id',
        filters: { owner_id: ownerId }
      }).pipe(
        map((rows) => rows.length),
        catchError(() => of(0))
      )
    );

    return forkJoin(requests).pipe(map((counts) => counts.reduce((sum, count) => sum + count, 0)));
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
