import { inject, Injectable } from '@angular/core';
import { AnalyticsService } from './analytics-service';

@Injectable({
  providedIn: 'root',
})
export class MobileDialpadService {
  private analytics = inject(AnalyticsService);

  call(phoneNumber: string, serviceType = 'service'): void {
    if (!phoneNumber) {
      return;
    }

    this.analytics.trackCall(serviceType);
    window.location.href = `tel:${phoneNumber}`;
  }
}
