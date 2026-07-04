import { CommonModule } from '@angular/common';
import { Component } from '@angular/core';
import { RouterModule } from '@angular/router';
import { TranslatePipe } from '../../../pipes/translatepipe-pipe';
import { HomeRepairType } from '../../../constants/enums/home-repair-types';

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
    { icon: '/images/ac-repair.png', name: HomeRepairType.AcRepair, navigation: 'repairs', category: HomeRepairType.AcRepair },
    { icon: '/images/fridge-repair.png', name: HomeRepairType.RefrigeratorRepair, navigation: 'repairs', category: HomeRepairType.RefrigeratorRepair },
    { icon: '/images/tv-repair.png', name: HomeRepairType.TvRepair, navigation: 'repairs', category: HomeRepairType.TvRepair },
    { icon: '/images/washing-machine-repair.png', name: HomeRepairType.WashingMachineRepair, navigation: 'repairs', category: HomeRepairType.WashingMachineRepair },
    { icon: '/images/home-geyser.png', name: HomeRepairType.GeyserRepair, navigation: 'repairs', category: HomeRepairType.GeyserRepair },
    { icon: '/images/microwave-repair.png', name: HomeRepairType.MicrowaveRepair, navigation: 'repairs', category: HomeRepairType.MicrowaveRepair },
    { icon: '/images/water-purifier.png', name: HomeRepairType.WaterPurifierRepair, navigation: 'repairs', category: HomeRepairType.WaterPurifierRepair },
    { icon: '/images/inverter-battery-repair.png', name: HomeRepairType.InverterBatteryRepair, navigation: 'repairs', category: HomeRepairType.InverterBatteryRepair },
    { icon: '/images/electrician.png', name: HomeRepairType.ElectricalRepair, navigation: 'repairs', category: HomeRepairType.ElectricalRepair },
    { icon: '/images/plumbing-repair.png', name: HomeRepairType.Plumbing, navigation: 'repairs', category: HomeRepairType.Plumbing },
    { icon: '/images/cooler-repair.png', name: HomeRepairType.FanCoolerRepair, navigation: 'repairs', category: HomeRepairType.FanCoolerRepair },
    { icon: '/images/mixer-grinder.png', name: HomeRepairType.MixerGrinderRepair, navigation: 'repairs', category: HomeRepairType.MixerGrinderRepair },
    { icon: '/images/computer-laptop.png', name: HomeRepairType.ComputerLaptopRepair, navigation: 'repairs', category: HomeRepairType.ComputerLaptopRepair },
    { icon: '/images/mobile-repair.png', name: HomeRepairType.MobileRepair, navigation: 'repairs', category: HomeRepairType.MobileRepair },
    { icon: '/images/carpenters.png', name: HomeRepairType.FurnitureRepair, navigation: 'repairs', category: HomeRepairType.FurnitureRepair },
    { icon: '/images/electrical-repair.png', name: HomeRepairType.OtherHomeApplianceRepair, navigation: 'repairs', category: HomeRepairType.OtherHomeApplianceRepair },
  ];

  readonly serviceSections = [
    {
      title: 'Vehicles',
      subtitle: 'Hire vehicles and machinery nearby',
      items: [this.categories[10],this.categories[0], this.categories[2]],
    },
    {
      title: 'Skilled Workers',
      subtitle: 'Find trusted people for every job',
      featured: true,
      items: this.categories.slice(4).filter((item) => item.navigation !== 'drivers'),
    },
    {
      title: 'Home Services',
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
