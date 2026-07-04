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
    { icon: '/images/hardware.png', name: 'Home Repairs', navigation: 'repairs' },
    { icon: '/images/dailywage-worker.png', name: 'Daily Wage', navigation: 'workers', category: 'Daily Wage' },
    { icon: '/images/construction-worker.png', name: 'Construction', navigation: 'workers', category: 'Construction' },
    { icon: '/images/carpenters.png', name: 'Carpenters', navigation: 'workers', category: 'Carpenter' },
    { icon: '/images/house-painter.png', name: 'Painters', navigation: 'workers', category: 'Painter' },
    { icon: '/images/electrician.png', name: 'Electricians', navigation: 'workers', category: 'Electrician' },
    { icon: '/images/plumber.jpg', name: 'Plumbers', navigation: 'workers', category: 'Plumber' },
    { icon: '/images/driver.png', name: 'Drivers', navigation: 'drivers' },
    { icon: '/images/worker.png', name: 'Cleaners', navigation: 'workers', category: 'Cleaner' },
  ];

  readonly dailyNeeds = [
    this.categories[5],
    this.categories[10],
    this.categories[11],
    this.categories[8],
  ];

  readonly repairServices: ServiceItem[] = [
    { icon: '/images/ac-repair.png', name: 'AC Repair', navigation: 'repairs', category: 'AC Repair' },
    { icon: '/images/fridge-repair.png', name: 'Fridge Repair', navigation: 'repairs', category: 'Refrigerator Repair' },
    { icon: '/images/tv-repair.png', name: 'TV Repair', navigation: 'repairs', category: 'TV Repair' },
    { icon: '/images/washing-machine-repair.png', name: 'Washing Machine', navigation: 'repairs', category: 'Washing Machine Repair' },
    { icon: '/images/home-geyser.png', name: 'Geyser Repair', navigation: 'repairs', category: 'Geyser Repair' },
    { icon: '/images/microwave-repair.png', name: 'Microwave Repair', navigation: 'repairs', category: 'Microwave Repair' },
    { icon: '/images/water-purifier.png', name: 'Water Purifier', navigation: 'repairs', category: 'RO / Water Purifier Repair' },
    { icon: '/images/inverter-battery-repair.png', name: 'Inverter & Battery', navigation: 'repairs', category: 'Inverter / Battery Repair' },
    { icon: '/images/electrician.png', name: 'Electrical Repair', navigation: 'repairs', category: 'Electrical Repair' },
    { icon: '/images/plumbing-repair.png', name: 'Plumbing', navigation: 'repairs', category: 'Plumbing' },
    { icon: '/images/cooler-repair.png', name: 'Fan & Cooler', navigation: 'repairs', category: 'Fan / Cooler Repair' },
    { icon: '/images/mixer-grinder.png', name: 'Mixer & Grinder', navigation: 'repairs', category: 'Mixer / Grinder Repair' },
    { icon: '/images/computer-laptop.png', name: 'Computer & Laptop', navigation: 'repairs', category: 'Computer / Laptop Repair' },
    { icon: '/images/mobile-repair.png', name: 'Mobile Repair', navigation: 'repairs', category: 'Mobile Repair' },
    { icon: '/images/carpenters.png', name: 'Furniture Repair', navigation: 'repairs', category: 'Furniture Repair' },
    { icon: '/images/electrical-repair.png', name: 'Other Repairs', navigation: 'repairs', category: 'Other Home Appliance Repair' },
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
      subtitle: 'Home appliance and maintenance services',
      items: this.repairServices,
    },
  ];

  openSection(section: any): void {
    this.activeSection = section;
  }

  closeSection(): void {
    this.activeSection = null;
  }
}
