import { CommonModule } from '@angular/common';
import { ChangeDetectorRef, Component, EventEmitter, inject, Output, signal } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MatDivider } from '@angular/material/divider';
import { MatIcon } from '@angular/material/icon';
import { MatMenuModule } from '@angular/material/menu';
import { MatToolbarModule } from '@angular/material/toolbar';
import { Router, RouterModule } from '@angular/router';
import { AuthService } from '../../../auth-services/auth-services';
import { DashboardServices } from '../../../shared-services/dashboard-services';

@Component({
  selector: 'app-header-component',
  imports: [CommonModule,
    MatToolbarModule,
    MatButtonModule,
    RouterModule,
    MatMenuModule,
    MatIcon,
    MatDivider,],
  templateUrl: './header-component.html',
  styleUrl: './header-component.css',
})
export class HeaderComponent {

  username = signal<string>('');
  router = inject(Router);
  authService = inject(AuthService);
  userId = signal<string>('');
  isLoggedIn: boolean = false;
  dashBoardService = inject(DashboardServices);
  isMobile = false;
  @Output() menuClick = new EventEmitter<void>();
  isMobileMenuOpen = false;
  Location: string = 'Hyderabad';
  cdr = inject(ChangeDetectorRef)

  ngOnInit(): void {

  this.dashBoardService.loginStatus$
    .subscribe(status => {

      this.isLoggedIn = status;

      console.log(this.isLoggedIn);

      if (status) {
        this.getuser();
      }
    });
}

  getuser() {
    const user = this.authService.getUser();

    this.userId.set(user?.id || '');
    this.username.set(user?.name || '');
  }

  logout() {
    this.isLoggedIn = false;
    sessionStorage.removeItem('userCredentials');
    sessionStorage.removeItem('book');
    this.authService.logout();
    this.dashBoardService.logOut();
    this.username.update((u) => (u = ''));
    this.router.navigate(['/']);
  }

  toggleMobileMenu() {
    this.isMobileMenuOpen = !this.isMobileMenuOpen;
  }

  // Close menu on route click (optional improvement)
  closeMobileMenu() {
    this.isMobileMenuOpen = false;
  }

  navToProfile() {
    this.router.navigate(['/profile']);
  }

  backToHome() {
    this.router.navigate(['/'])
  }
}
