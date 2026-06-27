import { EventEmitter, Injectable } from '@angular/core';
import { BehaviorSubject } from "rxjs";

@Injectable({
  providedIn: 'root',
})
export class DashboardServices {

    private loginStatusSubject = new BehaviorSubject<boolean>(
      !!localStorage.getItem('token') || !!sessionStorage.getItem('token')
    );

    loginStatus$ = this.loginStatusSubject.asObservable();

   logIn() {
    this.loginStatusSubject.next(true);
  }

  logOut() {
    this.loginStatusSubject.next(false);
  }
}
