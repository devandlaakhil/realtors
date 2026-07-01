import { Injectable, signal } from '@angular/core';

export interface GuestCallIdentity {
  id: string;
  name: string;
  mobile: string;
}

@Injectable({ providedIn: 'root' })
export class GuestCallIdentityService {
  private readonly storageKey = 'guest_call_identity';
  readonly isOpen = signal(false);
  readonly error = signal('');
  private resolver?: (identity: GuestCallIdentity | null) => void;

  request(): Promise<GuestCallIdentity | null> {
    const saved = this.getSaved();
    if (saved) {
      return Promise.resolve(saved);
    }

    this.error.set('');
    this.isOpen.set(true);
    return new Promise((resolve) => {
      this.resolver = resolve;
    });
  }

  submit(name: string, mobile: string): void {
    const cleanName = name.trim();
    const cleanMobile = mobile.replace(/\D/g, '');
    if (cleanName.length < 2) {
      this.error.set('Please enter your name.');
      return;
    }
    if (!/^[6-9]\d{9}$/.test(cleanMobile)) {
      this.error.set('Please enter a valid 10-digit mobile number.');
      return;
    }

    const identity: GuestCallIdentity = {
      id: this.getSaved()?.id ?? `guest-${crypto.randomUUID()}`,
      name: cleanName,
      mobile: cleanMobile,
    };
    localStorage.setItem(this.storageKey, JSON.stringify(identity));
    this.finish(identity);
  }

  cancel(): void {
    this.finish(null);
  }

  private getSaved(): GuestCallIdentity | null {
    try {
      return JSON.parse(localStorage.getItem(this.storageKey) ?? 'null');
    } catch {
      localStorage.removeItem(this.storageKey);
      return null;
    }
  }

  private finish(identity: GuestCallIdentity | null): void {
    this.isOpen.set(false);
    this.error.set('');
    this.resolver?.(identity);
    this.resolver = undefined;
  }
}
