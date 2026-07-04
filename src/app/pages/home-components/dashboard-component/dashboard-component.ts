import { Component, inject, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { AuthService } from '../../../auth-services/auth-services';
import { NavigationEnd, Router, RouterModule } from '@angular/router';
import { TranslatePipe } from '../../../pipes/translatepipe-pipe';
import { filter } from 'rxjs';

@Component({
  selector: 'app-dashboard-component',
  imports: [CommonModule, RouterModule,TranslatePipe],
  templateUrl: './dashboard-component.html',
  styleUrl: './dashboard-component.css',
})
export class DashboardComponent implements OnInit {
  isMobileMenuOpen: boolean = false;
  username = signal<string>('');
  authService = inject(AuthService);
  route = inject(Router);
  activeMenu = 'services';

  toggleMobileMenu(): void {
    this.isMobileMenuOpen = !this.isMobileMenuOpen;
  }

  ngOnInit(): void {
    const user = this.authService.getUser();
    this.username.set(user?.name || '');
    this.setActiveMenuFromUrl(this.route.url);
    this.route.events.pipe(filter((event) => event instanceof NavigationEnd)).subscribe(() => {
      this.setActiveMenuFromUrl(this.route.url);
    });

    if (this.route.url === '/dashboard') {
      this.navigateTo('home');
    }
  }

  navigateTo(value: string) {
    this.activeMenu = value;

    switch (value) {
      case 'home':
        this.route.navigateByUrl('/dashboard/home');
        break;

      case 'posts':
        this.route.navigateByUrl('/dashboard/my-posts');
        break;

      case 'services':
        this.route.navigateByUrl('/dashboard/services')
        break;

      case 'advertisement':
        this.route.navigateByUrl('/dashboard/advertisement');
        break;

      case 'reports':
        this.route.navigateByUrl('/dashboard/reports');
        break;

      case 'settings':
        break;
    }
  }

  private setActiveMenuFromUrl(url: string): void {
    if (url.includes('/dashboard/my-posts')) {
      this.activeMenu = 'posts';
      return;
    }

    if (url.includes('/dashboard/services')) {
      this.activeMenu = 'services';
      return;
    }

    if (url.includes('/dashboard/advertisement')) {
      this.activeMenu = 'advertisement';
      return;
    }

    if (url.includes('/dashboard/reports')) {
      this.activeMenu = 'reports';
      return;
    }

    this.activeMenu = 'home';
  }
}
