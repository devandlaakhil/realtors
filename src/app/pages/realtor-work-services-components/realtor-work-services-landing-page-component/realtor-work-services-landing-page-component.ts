import { CommonModule } from '@angular/common';
import { Component } from '@angular/core';
import { RouterModule } from '@angular/router';
import { TranslatePipe } from '../../../pipes/translatepipe-pipe';

interface ServiceItem {
  icon: string;
  name: string;
  navigation: string;
  category?: string;
}

@Component({
  selector: 'app-realtor-work-services-landing-page-component',
  imports: [CommonModule, RouterModule, TranslatePipe],
  templateUrl: './realtor-work-services-landing-page-component.html',
  styleUrl: './realtor-work-services-landing-page-component.css',
})
export class RealtorWorkServicesLandingPageComponent {
  activeSection: any = null;
  readonly previewLimit = 4;
  readonly categories: ServiceItem[] = [
    { icon: '/images/tractor.png', name: 'Commercial Vehicles', navigation: 'commercial-vehicles' },
    { icon: '/images/worker.png', name: 'Workers', navigation: 'workers' },
    { icon: '/images/transport.png', name: 'Transport', navigation: 'transport' },
    { icon: '/images/hardware.png', name: 'Hardware', navigation: 'hardware' },
    { icon: '/images/dailywage-worker.png', name: 'Daily Wage', navigation: 'workers', category: 'Daily Wage' },
    { icon: '/images/construction-worker.png', name: 'Construction', navigation: 'workers', category: 'Construction' },
    { icon: '/images/carpenters.png', name: 'Carpenters', navigation: 'workers', category: 'Carpenter' },
    { icon: '/images/house-painter.png', name: 'Painters', navigation: 'workers', category: 'Painter' },
    { icon: '/images/electrician.png', name: 'Electricians', navigation: 'workers', category: 'Electrician' },
    { icon: '/images/plumber.jpg', name: 'Plumbers', navigation: 'workers', category: 'Plumber' },
    { icon: '/images/driver.png', name: 'Drivers', navigation: 'workers', category: 'Driver' },
    { icon: '/images/worker.png', name: 'Cleaners', navigation: 'workers', category: 'Cleaner' },
  ];

  readonly dailyNeeds = [
    this.categories[5],
    this.categories[10],
    this.categories[11],
    this.categories[8],
  ];

  readonly serviceSections = [
    {
      title: 'Vehicles & Equipment',
      subtitle: 'Hire vehicles and machinery nearby',
      items: [this.categories[0], this.categories[2]],
    },
    {
      title: 'Skilled Workers',
      subtitle: 'Find trusted people for every job',
      featured: true,
      items: this.categories.slice(4),
    },
    {
      title: 'Shops & Services',
      subtitle: 'Materials and general service providers',
      items: [this.categories[3]],
    },
  ];

  openSection(section: any): void {
    this.activeSection = section;
  }

  closeSection(): void {
    this.activeSection = null;
  }
}
