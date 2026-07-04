import { Component, HostListener, inject } from '@angular/core';
import { Router, RouterModule } from '@angular/router';
import { MatIconModule } from '@angular/material/icon';
import { TranslatePipe } from '../../../pipes/translatepipe-pipe';
import { DashboardServices } from '../../../shared-services/dashboard-services';
import { ToastrService } from 'ngx-toastr';

@Component({
  selector: 'app-bottom-nav-component',
  imports: [RouterModule, MatIconModule, TranslatePipe],
  templateUrl: './bottom-nav-component.html',
  styleUrl: './bottom-nav-component.css',
})
export class BottomNavComponent {
  private router = inject(Router);
  private dashboardService = inject(DashboardServices);
  private toastr = inject(ToastrService);
  showPostPicker = false;
  isNavigatingToPost = false;
  isLoggedIn = false;

  postOptions = [
    { label: 'Property', image: '/images/realtors.png', route: '/ad-post' },
    { label: 'Worker', image: '/images/worker.png', route: '/services/workers' },
    { label: 'Commercial Vehicles', image: '/images/tractor.png', route: '/services/commercial-vehicles' },
    { label: 'Transport', image: '/images/transport.png', route: '/services/transport' },
    { label: 'Hardware', image: '/images/hardware.png', route: '/services/hardware' },
  ];

  navLinks: {
    label: string;
    icon: string;
    route: string;
    exact?: boolean;
    primary?: boolean;
    requiresAuth?: boolean;
  }[] = [
    { label: 'Home', icon: 'home', route: '/services/home', exact: true },
    { label: 'Dashboard', icon: 'dashboard', route: '/dashboard/services', requiresAuth: true },
    // { label: 'Real Estate', icon: 'home', route: '/home' },
    { label: 'Post', icon: 'add', route: '/ad-post', primary: true },
    { label: 'Reports', icon: 'bar_chart', route: '/dashboard/reports', requiresAuth: true },
    { label: 'Profile', icon: 'person', route: '/profile' },
  ];

  ngOnInit(): void {
    this.dashboardService.loginStatus$.subscribe((status) => {
      this.isLoggedIn = status;
    });
  }

  preventGuestNavigation(event: Event, requiresAuth?: boolean): void {
    if (requiresAuth && !this.isLoggedIn) {
      event.preventDefault();
      event.stopPropagation();
    }
  }

  openPostPicker(): void {
    if (!this.isLoggedIn) {
      this.toastr.clear();
      this.toastr.warning('Please login first to post a service.', 'Login required');
      return;
    }
    this.showPostPicker = true;
  }

  closePostPicker(): void {
    this.showPostPicker = false;
  }

  async selectPostOption(option: (typeof this.postOptions)[number]): Promise<void> {
    if (!this.isLoggedIn) {
      this.closePostPicker();
      this.toastr.warning('Please login first to post a service.', 'Login required');
      return;
    }

    if (this.isNavigatingToPost) {
      return;
    }

    this.isNavigatingToPost = true;
    const queryParams = option.route === '/ad-post' ? undefined : { post: 1 };

    try {
      const currentPath = this.router.url.split('?')[0];
      if (currentPath === option.route) {
        await this.router.navigateByUrl('/services/home', { skipLocationChange: true });
      }

      await this.router.navigate([option.route], { queryParams });
      this.closePostPicker();
    } finally {
      this.isNavigatingToPost = false;
    }
  }

  @HostListener('document:keydown.escape')
  onEscape(): void {
    this.closePostPicker();
  }
}
