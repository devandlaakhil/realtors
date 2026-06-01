import { Injectable } from '@angular/core';
import { BehaviorSubject } from 'rxjs';

@Injectable({
  providedIn: 'root',
})
export class CommonServices {

  private addressSubject = new BehaviorSubject<string | null>(null);
  address$ = this.addressSubject.asObservable();

  updateAddress(address: string) {
    this.addressSubject.next(address);
  }
}
