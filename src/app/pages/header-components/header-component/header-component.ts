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
import { UserApiServices } from '../../../api-services/user-api-services';
import { CommonServices } from '../../../shared-services/common-services';
import { TranslateModule, TranslateService } from '@ngx-translate/core';
import { LanguageServices } from '../../../shared-services/language-services';
import { TranslatePipe } from '../../../pipes/translatepipe-pipe';

@Component({
  selector: 'app-header-component',
  imports: [
    CommonModule,
    MatToolbarModule,
    MatButtonModule,
    RouterModule,
    MatMenuModule,
    MatIcon,
    MatDivider,
    TranslatePipe
  ],
  templateUrl: './header-component.html',
  styleUrl: './header-component.css',
  preserveWhitespaces: true,
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
  Location: string = '';
  fullAddress: string = '';
  cdr = inject(ChangeDetectorRef);
  userApiSrc = inject(UserApiServices);
  commonSrv = inject(CommonServices);
  languageSrv = inject(LanguageServices);
  selectedLang = 'en';

  ngOnInit(): void {
    this.dashBoardService.loginStatus$.subscribe((status) => {
      this.isLoggedIn = status;
      if (status) {
        this.getuser();
      }
    });
    this.getUserLocation();
  }

  toggleLanguage() {
    this.selectedLang = this.selectedLang === 'en' ? 'te' : 'en';
    this.languageSrv.loadLanguage(this.selectedLang)
  }

  getuser() {
    const user = this.authService.getUser();
    this.userId.set(user?.id || '');
    this.username.set(user?.name || '');
  }

  getUserLocation() {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          const coords = {
            latitude: position.coords.latitude,
            longitude: position.coords.longitude,
          };
          // Send these coordinates to your Node.js backend
          this.userApiSrc.sendCoordsToBackend(coords).subscribe((response: any) => {
            this.Location = response.raw.neighbourhood;
            this.fullAddress = response.address;
            this.commonSrv.updateAddress(this.fullAddress);
            this.cdr.detectChanges();
          });
        },
        (error) => {
          console.error('Error getting location', error);
        },
        { enableHighAccuracy: true, timeout: 5000 },
      );
    } else {
      alert('Geolocation is not supported by this browser.');
    }
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
    this.router.navigate(['/']);
  }
}
