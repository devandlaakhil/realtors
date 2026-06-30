import { Component } from '@angular/core';
import { RouterModule } from '@angular/router';
import { MatIconModule } from '@angular/material/icon';
import { TranslatePipe } from '../../../pipes/translatepipe-pipe';

@Component({
  selector: 'app-bottom-nav-component',
  imports: [RouterModule, MatIconModule, TranslatePipe],
  templateUrl: './bottom-nav-component.html',
  styleUrl: './bottom-nav-component.css',
})
export class BottomNavComponent {
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
}
