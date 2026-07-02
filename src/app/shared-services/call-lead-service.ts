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

  private asString(value: unknown): string {
    return value == null ? '' : String(value);
  }

  async record(provider: ServiceProviderCall, suppliedIdentity?: CallUserIdentity): Promise<void> {
    const sessionUser = this.auth.getUser();
    const loggedIn = this.auth.isLoggedIn();
    const profile = loggedIn
      ? await firstValueFrom(this.userApi.getUser(true))
      : null;
    const caller = loggedIn
      ? {
          id: this.asString(sessionUser?.id ?? profile?.id),
          name: this.asString(profile?.name ?? sessionUser?.name),
          mobile: this.asString(profile?.mobile ?? suppliedIdentity?.mobile),
        }
      : suppliedIdentity;
    if (!caller) return;
    if (loggedIn && !caller.id) {
      throw new Error('Logged-in user ID is unavailable');
    }

    await createServiceCall({
      userId: this.asString(caller.id),
      userName: this.asString(caller.name),
      userPhoneNumber: this.asString(caller.mobile),
      providerName: this.asString(provider.name),
      providerPhoneNumber: this.asString(provider.mobile),
      serviceName: this.asString(provider.serviceName ?? provider.name),
      serviceType: this.asString(provider.serviceType),
      locationAddress: provider.locationAddress == null
        ? null
        : this.asString(provider.locationAddress),
    });
  }

  async getLoggedInIdentity(): Promise<CallUserIdentity | null> {
    if (!this.auth.isLoggedIn()) return null;
    const sessionUser = this.auth.getUser();
    const profile = await firstValueFrom(this.userApi.getUser(true));
    const mobile = this.asString(profile?.mobile);
    const userId = this.asString(sessionUser?.id ?? profile?.id);
    if (!userId || !mobile) return null;
    return {
      id: userId,
      name: this.asString(profile?.name ?? sessionUser.name),
      mobile,
    };
  }
}
