import { inject, Injectable } from '@angular/core';
import { AnalyticsService } from './analytics-service';
import { CallLeadService, ServiceProviderCall } from './call-lead-service';
import { AuthService } from '../auth-services/auth-services';
import { GuestCallIdentityService } from './guest-call-identity-service';

@Injectable({
  providedIn: 'root',
})
export class MobileDialpadService {
  private analytics = inject(AnalyticsService);
  private callLeads = inject(CallLeadService);
  private auth = inject(AuthService);
  private guestIdentity = inject(GuestCallIdentityService);

  async call(provider: ServiceProviderCall): Promise<void> {
    if (!provider.mobile) {
      return;
    }

    const guest = this.auth.isLoggedIn() ? undefined : await this.guestIdentity.request();
    if (!this.auth.isLoggedIn() && !guest) {
      return;
    }

    this.analytics.trackCall(provider.serviceType);
    await this.callLeads.record(provider, guest ?? undefined).catch((error) => {
      console.warn('Unable to save service call lead', error);
    });
    window.location.href = `tel:${provider.mobile}`;
  }
}
