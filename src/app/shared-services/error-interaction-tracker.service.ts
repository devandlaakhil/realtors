import { Injectable, NgZone, inject } from '@angular/core';

export interface LastInteractionInfo {
  tag: string;
  text: string;
  id: string;
  classes: string;
  ariaLabel: string;
  href: string;
  route: string;
  at: string;
}

@Injectable({ providedIn: 'root' })
export class ErrorInteractionTrackerService {
  private readonly zone = inject(NgZone);
  private lastInteraction: LastInteractionInfo | null = null;
  private initialized = false;

  initialize(): void {
    if (this.initialized || typeof document === 'undefined') return;
    this.initialized = true;
    this.zone.runOutsideAngular(() => {
      document.addEventListener('click', this.captureInteraction, true);
      document.addEventListener('submit', this.captureInteraction, true);
    });
  }

  getLastInteraction(): LastInteractionInfo | null {
    return this.lastInteraction;
  }

  private readonly captureInteraction = (event: Event): void => {
    const target = event.target instanceof Element ? event.target : null;
    const element = target?.closest('button,a,[role="button"],input[type="button"],input[type="submit"]');
    if (!element) return;

    this.lastInteraction = {
      tag: element.tagName.toLowerCase(),
      text: this.cleanText(element.textContent || (element as HTMLInputElement).value || ''),
      id: element.id || '',
      classes: element.className?.toString?.() || '',
      ariaLabel: element.getAttribute('aria-label') || '',
      href: element.getAttribute('href') || '',
      route: location.hash || location.pathname,
      at: new Date().toISOString(),
    };
  };

  private cleanText(value: string): string {
    return value.replace(/\s+/g, ' ').trim().slice(0, 120);
  }
}
