import { inject, Injectable } from '@angular/core';
import { Observable, map, switchMap, of, catchError, throwError } from 'rxjs';
import { SUPABASE_TABLES } from '../constants/supabase.constants';
import { SupabaseClientService } from '../shared-services/supabase-client.service';

export interface SupabaseAuthUser {
  id: string;
  email?: string;
  user_metadata?: {
    name?: string;
    mobile?: string;
  };
}

interface SupabaseAuthSessionResponse {
  access_token?: string;
  refresh_token?: string;
  user?: SupabaseAuthUser;
}

interface AppAuthResponse {
  data: {
    token: string;
    refreshToken?: string;
    user: {
      id: string;
      name: string;
      email: string;
      mobile?: string;
    };
  };
}

@Injectable({ providedIn: 'root' })
export class SupabaseAuthApiService {
  private readonly supabase = inject(SupabaseClientService);

  get enabled(): boolean {
    return this.supabase.enabled;
  }

  register(user: { name: string; email: string; password: string; mobile?: string }): Observable<AppAuthResponse> {
    const email = this.normalizeEmail(user.email);
    const password = this.normalizePassword(user.password);

    return this.supabase.authPost<SupabaseAuthSessionResponse>('signup', {
      email,
      password,
      data: {
        name: user.name?.trim() || '',
        mobile: user.mobile?.trim() || ''
      }
    }).pipe(
      switchMap((res) => {
        if (!res.access_token || !res.user) {
          return of(this.toAppResponse(res, user));
        }

        return this.saveProfile(res.access_token, {
          id: res.user.id,
          name: user.name?.trim() || '',
          email,
          mobile: user.mobile?.trim() || ''
        }).pipe(
          map(() => this.toAppResponse(res, user)),
          catchError(() => of(this.toAppResponse(res, user)))
        );
      })
    );
  }

  login(credentials: { email: string; password: string }): Observable<AppAuthResponse> {
    const email = this.normalizeEmail(credentials.email);
    const password = this.normalizePassword(credentials.password);

    return this.supabase.authPost<SupabaseAuthSessionResponse>('token?grant_type=password', {
      email,
      password
    }).pipe(
      switchMap((res) => {
        if (!res.access_token) {
          return throwError(() => new Error('Supabase did not return an access token for this login.'));
        }

        return this.ensureProfile(res, email).pipe(
          map((profile) => this.toAppResponse(res, {
            email,
            name: profile?.name || '',
            mobile: profile?.mobile || ''
          })),
          catchError(() => of(this.toAppResponse(res, { email, name: '', mobile: '' })))
        );
      })
    );
  }

  private saveProfile(accessToken: string, profile: { id: string; name: string; email: string; mobile: string }): Observable<unknown> {
    return this.supabase.insertWithAuth(SUPABASE_TABLES.profiles, profile, accessToken);
  }

  private ensureProfile(res: SupabaseAuthSessionResponse, email: string): Observable<{ name?: string; mobile?: string } | null> {
    if (!res.access_token || !res.user?.id) return of(null);

    const fallbackProfile = {
      id: res.user.id,
      name: res.user.user_metadata?.name || email.split('@')[0],
      email: res.user.email || email,
      mobile: res.user.user_metadata?.mobile || ''
    };

    return this.supabase.selectWithAuth<{ name?: string; mobile?: string }>(
      SUPABASE_TABLES.profiles,
      res.access_token,
      {
        filters: { id: res.user.id },
        limit: 1
      }
    ).pipe(
      switchMap((rows) => {
        if (rows.length) return of(rows[0]);
        return this.saveProfile(res.access_token || '', fallbackProfile).pipe(map(() => fallbackProfile));
      })
    );
  }

  private toAppResponse(res: SupabaseAuthSessionResponse, fallback: { email: string; name?: string; mobile?: string }): AppAuthResponse {
    const user = res.user;
    const token = res.access_token || '';

    return {
      data: {
        token,
        refreshToken: res.refresh_token,
        user: {
          id: user?.id || '',
          name: user?.user_metadata?.name || fallback.name || fallback.email.split('@')[0],
          email: user?.email || fallback.email,
          mobile: user?.user_metadata?.mobile || fallback.mobile || ''
        }
      }
    };
  }

  private normalizeEmail(email: string): string {
    return (email || '').trim().toLowerCase();
  }

  private normalizePassword(password: string): string {
    return (password || '').trim();
  }
}
