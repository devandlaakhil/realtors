import { Injectable } from '@angular/core';
import { BehaviorSubject } from 'rxjs';

@Injectable({
  providedIn: 'root',
})
export class CommonServices {
  private readonly addressStorageKey = 'nearwages_current_address';

  private addressSubject = new BehaviorSubject<string | null>(
    this.readStoredAddress()
  );
  address$ = this.addressSubject.asObservable();

  updateAddress(address: string) {
    if (address) {
      this.writeStoredAddress(address);
    }
    this.addressSubject.next(address);
  }

  getAddress(): string {
    return this.addressSubject.value || this.readStoredAddress() || '';
  }

  private readStoredAddress(): string | null {
    try {
      return localStorage.getItem(this.addressStorageKey);
    } catch {
      return null;
    }
  }

  private writeStoredAddress(address: string): void {
    try {
      localStorage.setItem(this.addressStorageKey, address);
    } catch {
      // Storage can be unavailable in restricted WebView contexts.
    }
  }
}
