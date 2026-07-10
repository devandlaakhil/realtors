import { Location } from '@angular/common';
import { Component, inject, OnDestroy, OnInit, signal } from '@angular/core';
import { NavigationStart, Router, RouterOutlet } from '@angular/router';
import { App as CapacitorApp } from '@capacitor/app';
import type { PluginListenerHandle } from '@capacitor/core';
import { HeaderComponent } from '../app/pages/header-components/header-component/header-component';
import { LoaderComponent } from './pages/shared-components/loader-component/loader-component';
import { BottomNavComponent } from './pages/shared-components/bottom-nav-component/bottom-nav-component';
import { AnalyticsService } from './shared-services/analytics-service';
import { GuestCallIdentityService } from './shared-services/guest-call-identity-service';
import { LoaderServices } from './shared-services/loader-services';
@Component({
  selector: 'app-root',
  imports: [RouterOutlet, HeaderComponent, LoaderComponent, BottomNavComponent],
  templateUrl: './app.html',
  styleUrl: './app.css'
})
export class App implements OnInit, OnDestroy {
  protected readonly title = signal('NearWages');
  private router = inject(Router);
  private location = inject(Location);
  private analytics = inject(AnalyticsService);
  private loader = inject(LoaderServices);
  readonly guestCallIdentity = inject(GuestCallIdentityService);
  readonly showLocationPrompt = signal(false);
  readonly locationPromptMessage = signal('');
  readonly checkingLocation = signal(false);
  private backButtonListener?: PluginListenerHandle;
  private readonly locationOkStorageKey = 'nearwages.location.okAt';
  private readonly locationFreshMs = 30 * 1000;
  private readonly visibilityHandler = () => {
    if (document.visibilityState === 'visible') {
      this.checkLocation({ force: this.showLocationPrompt() });
    }
  };

  async ngOnInit(): Promise<void> {
    this.analytics.initialize();
    this.router.events.subscribe((event) => {
      if (event instanceof NavigationStart) {
        this.loader.reset();
      }
    });
    this.checkLocation();
    document.addEventListener('visibilitychange', this.visibilityHandler);
    this.backButtonListener = await CapacitorApp.addListener('backButton', ({ canGoBack }) => {
      if (canGoBack && this.router.url !== '/') {
        this.location.back();
        return;
      }

      if (this.router.url !== '/') {
        this.router.navigate(['/']);
        return;
      }

      CapacitorApp.exitApp();
    });
  }

  ngOnDestroy(): void {
    this.backButtonListener?.remove();
    document.removeEventListener('visibilitychange', this.visibilityHandler);
  }

  checkLocation(options: { force?: boolean } = {}): void {
    if (!navigator.geolocation || this.checkingLocation()) {
      if (!navigator.geolocation) {
        this.blockForLocation('Location is required for NearWages, but this device or browser does not support location.');
      }
      return;
    }

    if (!options.force && this.hasFreshLocationCheck()) {
      this.showLocationPrompt.set(false);
      this.locationPromptMessage.set('');
      return;
    }

    this.checkingLocation.set(true);
    navigator.geolocation.getCurrentPosition(
      () => {
        this.checkingLocation.set(false);
        this.showLocationPrompt.set(false);
        this.locationPromptMessage.set('');
        this.rememberLocationOk();
      },
      (error) => {
        this.checkingLocation.set(false);
        sessionStorage.removeItem(this.locationOkStorageKey);
        this.blockForLocation(
          error.code === error.PERMISSION_DENIED
            ? 'Location permission is blocked. Allow location for NearWages in your browser or app settings, then tap Retry.'
            : 'Your phone location service appears to be turned off. Turn on Location/GPS in Quick Settings or Settings, then tap Retry.'
        );
      },
      { enableHighAccuracy: false, timeout: 12000, maximumAge: this.locationFreshMs },
    );
  }

  private hasFreshLocationCheck(): boolean {
    const lastOkAt = Number(sessionStorage.getItem(this.locationOkStorageKey) || 0);
    return Number.isFinite(lastOkAt) && Date.now() - lastOkAt < this.locationFreshMs;
  }

  private rememberLocationOk(): void {
    sessionStorage.setItem(this.locationOkStorageKey, String(Date.now()));
  }

  private blockForLocation(message: string): void {
    this.showLocationPrompt.set(true);
    this.locationPromptMessage.set(message);
  }
}
