import { Injectable } from '@angular/core';

@Injectable({
  providedIn: 'root',
})
export class MobileDialpadService {
  call(phoneNumber: string): void {
    if (!phoneNumber) {
      return;
    }

    window.location.href = `tel:${phoneNumber}`;
  }
}
