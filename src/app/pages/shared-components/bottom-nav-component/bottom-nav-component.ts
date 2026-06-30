import { Component, HostListener, inject } from '@angular/core';
import { Router, RouterModule } from '@angular/router';
import { MatIconModule } from '@angular/material/icon';
import { TranslatePipe } from '../../../pipes/translatepipe-pipe';

@Component({
  selector: 'app-bottom-nav-component',
  imports: [RouterModule, MatIconModule, TranslatePipe],
  templateUrl: './bottom-nav-component.html',
  styleUrl: './bottom-nav-component.css',
})
export class BottomNavComponent {
  private router = inject(Router);
  showPostPicker = false;

  postOptions = [
    { label: 'Property', description: 'Sell or rent property', icon: 'home_work', route: '/ad-post' },
    { label: 'Worker', description: 'Offer skilled services', icon: 'engineering', route: '/services/workers' },
    { label: 'Tractor', description: 'List tractor services', icon: 'agriculture', route: '/services/tractor' },
    { label: 'Transport', description: 'Add a transport vehicle', icon: 'local_shipping', route: '/services/transport' },
    { label: 'Hardware Shop', description: 'List your hardware shop', icon: 'hardware', route: '/services/hardware' },
  ];

  navLinks: {
    label: string;
    icon: string;
    route: string;
    exact?: boolean;
    primary?: boolean;
  }[] = [
    { label: 'Home', icon: 'home', route: '/home', exact: true },
    { label: 'Services', icon: 'handyman', route: '/services/home' },
    { label: 'Post', icon: 'add', route: '/ad-post', primary: true },
    { label: 'My Posts', icon: 'dashboard', route: '/dashboard/my-posts' },
    { label: 'Profile', icon: 'person', route: '/profile' },
  ];

  openPostPicker(): void {
    this.showPostPicker = true;
  }

  closePostPicker(): void {
    this.showPostPicker = false;
  }

  selectPostOption(option: (typeof this.postOptions)[number]): void {
    this.closePostPicker();
    const queryParams = option.route === '/ad-post' ? undefined : { post: 1 };
    this.router.navigate([option.route], { queryParams });
  }

  @HostListener('document:keydown.escape')
  onEscape(): void {
    this.closePostPicker();
  }
}
