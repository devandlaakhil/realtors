import { Injectable } from '@angular/core';
import { BehaviorSubject } from 'rxjs';

@Injectable({
  providedIn: 'root',
})
export class CommonServices {
  private readonly addressStorageKey = 'nearwages_current_address';

  private addressSubject = new BehaviorSubject<string | null>(
    localStorage.getItem(this.addressStorageKey)
  );
  address$ = this.addressSubject.asObservable();

  updateAddress(address: string) {
    if (address) {
      localStorage.setItem(this.addressStorageKey, address);
    }
    this.addressSubject.next(address);
  }
}
