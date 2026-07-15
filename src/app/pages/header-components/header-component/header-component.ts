import { CommonModule, Location } from '@angular/common';
import { ChangeDetectorRef, Component, EventEmitter, inject, Output, signal } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MatDivider } from '@angular/material/divider';
import { MatIcon } from '@angular/material/icon';
import { MatMenuModule } from '@angular/material/menu';
import { MatToolbarModule } from '@angular/material/toolbar';
import { NavigationEnd, Router, RouterModule } from '@angular/router';
import { AuthService } from '../../../auth-services/auth-services';
import { DashboardServices } from '../../../shared-services/dashboard-services';
import { UserApiServices } from '../../../api-services/user-api-services';
import { CommonServices } from '../../../shared-services/common-services';
import { TranslateModule, TranslateService } from '@ngx-translate/core';
import { LanguageServices } from '../../../shared-services/language-services';
import { TranslatePipe } from '../../../pipes/translatepipe-pipe';
import { filter } from 'rxjs';

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
  location = inject(Location);
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
  selectedLang = this.languageSrv.currentLanguage;
  showBackButton = false;

  ngOnInit(): void {
    this.showBackButton = !this.isRootUrl(this.router.url);
    this.router.events.pipe(filter((event) => event instanceof NavigationEnd)).subscribe(() => {
      this.showBackButton = !this.isRootUrl(this.router.url);
      this.closeMobileMenu();
    });
    this.languageSrv.languageChange$.subscribe((lang) => {
      this.selectedLang = lang;
      this.cdr.detectChanges();
    });

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
    this.languageSrv.loadLanguage(this.selectedLang);
  }

  getuser() {
    const user = this.authService.getUser();
    this.userId.set(user?.id || '');
    this.username.set(user?.name || '');
  }

  getUserLocation() {
    const cachedAddress = this.commonSrv.getAddress?.() || '';
    if (cachedAddress) {
      this.fullAddress = cachedAddress;
      this.Location = cachedAddress.split(',')[0] || cachedAddress;
    }

    if (!navigator.geolocation) {
      this.cdr.detectChanges();
      return;
    }

    navigator.geolocation.getCurrentPosition(
      (position) => {
        const coords = {
          latitude: position.coords.latitude,
          longitude: position.coords.longitude,
        };
        this.userApiSrc.sendCoordsToBackend(coords).subscribe({
          next: (response: any) => {
            this.Location = this.pickShortLocation(response);
            this.fullAddress = response?.address || this.Location || this.fullAddress || '';
            if (this.fullAddress) this.commonSrv.updateAddress(this.fullAddress);
            this.cdr.detectChanges();
          },
          error: () => {
            this.cdr.detectChanges();
          },
        });
      },
      () => {
        this.cdr.detectChanges();
      },
      { enableHighAccuracy: false, timeout: 3000, maximumAge: 60000 },
    );
  }

  private pickShortLocation(response: any): string {
    const raw = response?.raw || {};
    return (
      raw.neighbourhood ||
      raw.suburb ||
      raw.village ||
      raw.town ||
      raw.city ||
      raw.county ||
      response?.address ||
      ''
    );
  }

  logout() {
    this.isLoggedIn = false;
    sessionStorage.removeItem('userCredentials');
    sessionStorage.removeItem('book');
    localStorage.removeItem('userCredentials');
    localStorage.removeItem('book');
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

  navToSubscription(){
    this.router.navigate(['/subscription']);
  }

  backToHome() {
    this.router.navigate(['/']);
  }

  private isRootUrl(url: string): boolean {
    const path = url.split('?')[0].split('#')[0];
    return path === '/' || path === '/services/home';
  }

  goBack() {
    if (window.history.length > 1) {
      this.location.back();
      return;
    }

    this.router.navigate(['/']);
  }
}
