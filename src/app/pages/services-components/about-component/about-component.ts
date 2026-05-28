import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterModule } from '@angular/router';

interface Feature {
  icon: string;
  title: string;
  desc: string;
}

@Component({
  selector: 'app-about-component',
  imports: [CommonModule,RouterModule],
  templateUrl: './about-component.html',
  styleUrl: './about-component.css',
})
export class AboutComponent {
  companyName: string = 'Realtors';
  router = inject(Router);

  features: Feature[] = [
    {
      icon: '🗺️',
      title: 'Plots & Lands',
      desc: 'List or discover agricultural layouts, industrial zones, and residential plots instantly.',
    },
    {
      icon: '🏢',
      title: 'Apartments & Flats',
      desc: 'Browse modern high-rise buildings, cozy family homes, and premium gated communities.',
    },
    {
      icon: '🤝',
      title: 'Direct Deals',
      desc: 'Connect straight with verified landowners and individual buyers without hidden broker fees.',
    },
  ];

  backToHome() {
    this.router.navigate(['/']);
  }
}
