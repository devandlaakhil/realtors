import { inject, Injectable } from '@angular/core';
import { createServiceCall } from '@dataconnect/generated';
import { firstValueFrom } from 'rxjs';
import { AuthService } from '../auth-services/auth-services';
import { UserApiServices } from '../api-services/user-api-services';
import './firebase';

export interface ServiceProviderCall {
  id: string;
  name: string;
  mobile: string;
  serviceType: string;
  serviceName?: string;
  locationAddress?: string;
}

export interface CallUserIdentity {
  id: string;
  name: string;
  mobile: string;
}

@Injectable({ providedIn: 'root' })
export class CallLeadService {
  private auth = inject(AuthService);
  private userApi = inject(UserApiServices);

  async record(provider: ServiceProviderCall, guest?: CallUserIdentity): Promise<void> {
    const sessionUser = this.auth.getUser();
    const profile = !guest && this.auth.isLoggedIn()
      ? await firstValueFrom(this.userApi.getUser())
      : null;
    const caller = guest ?? (this.auth.isLoggedIn()
      ? {
          id: String(sessionUser?.id ?? ''),
          name: profile?.name ?? sessionUser?.name ?? '',
          mobile: profile?.mobile ?? '',
        }
      : undefined);
    if (!caller) return;

    await createServiceCall({
      userId: caller.id,
      userName: caller.name,
      userPhoneNumber: caller.mobile,
      providerName: provider.name ?? '',
      providerPhoneNumber: provider.mobile ?? '',
      serviceName: provider.serviceName ?? provider.name ?? '',
      serviceType: provider.serviceType,
      locationAddress: provider.locationAddress ?? null,
    });
  }

  async getLoggedInIdentity(): Promise<CallUserIdentity | null> {
    if (!this.auth.isLoggedIn()) return null;
    const sessionUser = this.auth.getUser();
    const profile = await firstValueFrom(this.userApi.getUser());
    const mobile = profile?.mobile ?? '';
    if (!sessionUser?.id || !mobile) return null;
    return {
      id: String(sessionUser.id),
      name: profile?.name ?? sessionUser.name ?? '',
      mobile,
    };
  }
}
