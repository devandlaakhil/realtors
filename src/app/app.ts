import { Location } from '@angular/common';
import { Component, inject, OnDestroy, OnInit, signal } from '@angular/core';
import { Router, RouterOutlet } from '@angular/router';
import { App as CapacitorApp } from '@capacitor/app';
import type { PluginListenerHandle } from '@capacitor/core';
import { HeaderComponent } from '../app/pages/header-components/header-component/header-component';
import { LoaderComponent } from './pages/shared-components/loader-component/loader-component';
import { BottomNavComponent } from './pages/shared-components/bottom-nav-component/bottom-nav-component';
import { AnalyticsService } from './shared-services/analytics-service';
import { GuestCallIdentityService } from './shared-services/guest-call-identity-service';
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
  readonly guestCallIdentity = inject(GuestCallIdentityService);
  readonly showLocationPrompt = signal(false);
  readonly locationPromptMessage = signal('');
  readonly checkingLocation = signal(false);
  private backButtonListener?: PluginListenerHandle;
  private readonly visibilityHandler = () => {
    if (document.visibilityState === 'visible' && this.showLocationPrompt()) {
      this.checkLocation();
    }
  };

  async ngOnInit(): Promise<void> {
    this.analytics.initialize();
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

  checkLocation(): void {
    if (!navigator.geolocation || this.checkingLocation()) {
      return;
    }

    this.checkingLocation.set(true);
    navigator.geolocation.getCurrentPosition(
      () => {
        this.checkingLocation.set(false);
        this.showLocationPrompt.set(false);
        this.locationPromptMessage.set('');
      },
      (error) => {
        this.checkingLocation.set(false);
        this.showLocationPrompt.set(true);
        this.locationPromptMessage.set(
          error.code === error.PERMISSION_DENIED
            ? 'Location permission is blocked. Allow location for NearWages in your browser or app settings, then tap Retry.'
            : 'Your phone location service appears to be turned off. Turn on Location/GPS in Quick Settings or Settings, then tap Retry.',
        );
      },
      { enableHighAccuracy: true, timeout: 8000, maximumAge: 30000 },
    );
  }
}
