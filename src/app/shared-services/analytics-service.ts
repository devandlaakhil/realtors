import { DOCUMENT } from '@angular/common';
import { inject, Injectable, NgZone } from '@angular/core';
import { NavigationEnd, Router } from '@angular/router';
import { filter } from 'rxjs';
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
  private router = inject(Router);
  private zone = inject(NgZone);
  private initialized = false;
  private measurementId = '';

  initialize(): void {
    try {
      const measurementId = environment.googleAnalyticsId?.trim();
      if (this.initialized || !measurementId || typeof window === 'undefined') {
        return;
      }

      this.initialized = true;
      this.measurementId = measurementId;
      window.dataLayer = window.dataLayer || [];
      window.gtag = (...args: unknown[]) => window.dataLayer.push(args);
      window.gtag('js', new Date());
      window.gtag('config', measurementId, { send_page_view: false });

      const script = this.document.createElement('script');
      script.async = true;
      script.src = `https://www.googletagmanager.com/gtag/js?id=${encodeURIComponent(measurementId)}`;
      this.document.head.appendChild(script);

      this.trackPageView(this.router.url);
      this.router.events
        .pipe(filter((event) => event instanceof NavigationEnd))
        .subscribe((event) => this.trackPageView((event as NavigationEnd).urlAfterRedirects));
      this.trackClicks();
    } catch (error) {
      console.warn('Analytics initialization failed', error);
    }
  }

  trackCall(serviceType: string): void {
    this.sendEvent('call_click', {
      event_category: 'engagement',
      service_type: serviceType,
      click_location: 'service_call_button',
      page_path: this.pagePath(),
    });
  }

  trackPageView(url: string): void {
    try {
      if (!this.measurementId) return;
      window.gtag?.('event', 'page_view', {
        page_title: this.document.title || 'NearWages',
        page_location: location.href,
        page_path: this.normalizePath(url),
      });
    } catch {
      // Analytics must never block the app.
    }
  }

  private sendEvent(name: string, params: Record<string, unknown>): void {
    window.gtag?.('event', name, params);
  }

  private trackClicks(): void {
    this.zone.runOutsideAngular(() => {
      this.document.addEventListener('click', (event) => {
        const target = event.target instanceof Element ? event.target : null;
        const element = target?.closest('button,a,[role="button"]');
        if (!element || !window.gtag) return;

        this.sendEvent('ui_click', {
          event_category: 'engagement',
          click_text: this.cleanText(element.textContent || element.getAttribute('aria-label') || ''),
          click_tag: element.tagName.toLowerCase(),
          click_href: element.getAttribute('href') || '',
          page_path: this.pagePath(),
        });
      }, true);
    });
  }

  private pagePath(): string {
    return this.normalizePath(this.router.url);
  }

  private normalizePath(url: string): string {
    const path = (url || location.hash || location.pathname).replace(/^#/, '');
    return path || '/';
  }

  private cleanText(value: string): string {
    return value.replace(/\s+/g, ' ').trim().slice(0, 80);
  }
}
