import { inject, Injectable } from '@angular/core';
import { AnalyticsService } from './analytics-service';
import { CallLeadService, ServiceProviderCall } from './call-lead-service';
import { AuthService } from '../auth-services/auth-services';
import { GuestCallIdentityService } from './guest-call-identity-service';
import { ToastrService } from 'ngx-toastr';

@Injectable({
  providedIn: 'root',
})
export class MobileDialpadService {
  private analytics = inject(AnalyticsService);
  private callLeads = inject(CallLeadService);
  private auth = inject(AuthService);
  private guestIdentity = inject(GuestCallIdentityService);
  private toastr = inject(ToastrService);

  async call(provider: ServiceProviderCall): Promise<void> {
    if (!provider.mobile) {
      return;
    }

    const loggedIn = this.auth.isLoggedIn();
    let caller = undefined;
    if (loggedIn) {
      caller = await this.callLeads.getLoggedInIdentity().catch(() => null);
    } else {
      caller = await this.guestIdentity.request();
    }
    if (!caller && !loggedIn) {
      return;
    }

    this.analytics.trackCall(provider.serviceType);
    let recorded = true;
    await this.callLeads.record(provider, caller ?? undefined).catch((error) => {
      recorded = false;
      console.warn('Unable to save service call lead', error);
      const detail = error?.code ?? error?.status ?? error?.message ?? 'unknown error';
      this.toastr.warning(`Call opened, but tracking failed (${detail}).`, 'Call tracking');
    });
    if (recorded) {
      this.toastr.success('Call details saved.', 'Calling service');
    }
    window.location.href = `tel:${provider.mobile}`;
  }
}
