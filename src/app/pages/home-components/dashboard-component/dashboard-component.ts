import { Component, inject, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { AuthService } from '../../../auth-services/auth-services';
import { Router, RouterModule } from '@angular/router';

@Component({
  selector: 'app-dashboard-component',
  imports: [CommonModule, RouterModule],
  templateUrl: './dashboard-component.html',
  styleUrl: './dashboard-component.css',
})
export class DashboardComponent implements OnInit {
  isMobileMenuOpen: boolean = false;
  username = signal<string>('');
  authService = inject(AuthService);
  route = inject(Router);
  activeMenu = 'home';

  toggleMobileMenu(): void {
    this.isMobileMenuOpen = !this.isMobileMenuOpen;
  }

  ngOnInit(): void {
    const user = this.authService.getUser();
    this.username.set(user?.name || '');
    this.navigateTo('home');
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

      case 'enquiries':
        break;

      case 'settings':
        break;
    }
  }
}
