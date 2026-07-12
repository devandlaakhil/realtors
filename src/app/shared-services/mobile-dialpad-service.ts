import { inject, Injectable } from '@angular/core';
import { AnalyticsService } from './analytics-service';
import { CallLeadService, ServiceProviderCall } from './call-lead-service';
import { AuthService } from '../auth-services/auth-services';
import { GuestCallIdentityService } from './guest-call-identity-service';
import { ToastrService } from 'ngx-toastr';
import { ErrorLogService } from './error-log.service';

@Injectable({
  providedIn: 'root',
})
export class MobileDialpadService {
  private analytics = inject(AnalyticsService);
  private callLeads = inject(CallLeadService);
  private auth = inject(AuthService);
  private guestIdentity = inject(GuestCallIdentityService);
  private toastr = inject(ToastrService);
  private logs = inject(ErrorLogService);

  async call(provider: ServiceProviderCall): Promise<void> {
    if (!provider.mobile) {
      this.logs.log({
        source: 'button',
        action: 'call_service',
        message: 'Call button pressed without provider mobile number',
        details: provider,
      });
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
      this.logs.log({
        source: 'button',
        action: 'call_service_tracking',
        message: 'Unable to save service call lead',
        details: error,
      });
      console.warn('Unable to save service call lead', error);
      const detail = error?.code ?? error?.status ?? error?.message ?? 'unknown error';
      this.toastr.warning(`Call opened, but tracking failed (${detail}).`, 'Call tracking');
    });
    if (recorded) {
      this.toastr.success('Call details saved.', 'Calling service');
    }
    try {
      window.location.href = `tel:${provider.mobile}`;
    } catch (error) {
      this.logs.log({
        source: 'button',
        action: 'open_dialer',
        message: 'Unable to open dialer',
        details: error,
      });
      this.toastr.error('Unable to open dialer.');
    }
  }
}
