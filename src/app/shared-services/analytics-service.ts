import { DOCUMENT } from '@angular/common';
import { inject, Injectable } from '@angular/core';
import { environment } from '../../environments/environment';

declare global {
  interface Window {
    dataLayer: unknown[];
    gtag?: (...args: unknown[]) => void;
  }
}

@Injectable({ providedIn: 'root' })
export class AnalyticsService {
  private document = inject(DOCUMENT);
  private initialized = false;

  initialize(): void {
    const measurementId = environment.googleAnalyticsId?.trim();
    if (this.initialized || !measurementId || typeof window === 'undefined') {
      return;
    }

    this.initialized = true;
    window.dataLayer = window.dataLayer || [];
    window.gtag = (...args: unknown[]) => window.dataLayer.push(args);
    window.gtag('js', new Date());
    window.gtag('config', measurementId, { send_page_view: true });

    const script = this.document.createElement('script');
    script.async = true;
    script.src = `https://www.googletagmanager.com/gtag/js?id=${encodeURIComponent(measurementId)}`;
    this.document.head.appendChild(script);

  }

  trackCall(serviceType: string): void {
    window.gtag?.('event', 'call_click', {
      event_category: 'engagement',
      service_type: serviceType,
      click_location: 'service_call_button',
      page_path: window.location.pathname,
    });
  }
}
