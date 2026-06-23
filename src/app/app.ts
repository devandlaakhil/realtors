import { Location } from '@angular/common';
import { Component, inject, OnDestroy, OnInit, signal } from '@angular/core';
import { Router, RouterOutlet } from '@angular/router';
import { App as CapacitorApp } from '@capacitor/app';
import type { PluginListenerHandle } from '@capacitor/core';
import { HeaderComponent } from '../app/pages/header-components/header-component/header-component';
import { LoaderComponent } from './pages/shared-components/loader-component/loader-component';
@Component({
  selector: 'app-root',
  imports: [RouterOutlet,HeaderComponent,LoaderComponent],
  templateUrl: './app.html',
  styleUrl: './app.css'
})
export class App implements OnInit, OnDestroy {
  protected readonly title = signal('realtors');
  private router = inject(Router);
  private location = inject(Location);
  private backButtonListener?: PluginListenerHandle;

  async ngOnInit(): Promise<void> {
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
  }
}
