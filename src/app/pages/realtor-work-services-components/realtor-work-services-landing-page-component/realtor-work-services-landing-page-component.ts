import { CommonModule } from '@angular/common';
import { Component } from '@angular/core';
import { RouterModule } from '@angular/router';
import { TranslatePipe } from '../../../pipes/translatepipe-pipe';

@Component({
  selector: 'app-realtor-work-services-landing-page-component',
  imports: [CommonModule,RouterModule,TranslatePipe],
  templateUrl: './realtor-work-services-landing-page-component.html',
  styleUrl: './realtor-work-services-landing-page-component.css',
})
export class RealtorWorkServicesLandingPageComponent {
  categories = [
  { icon: '/images/tractor.png', name: 'Tractors', navigation: 'tractor' },
  { icon: '/images/hardware.png', name: 'Hardware', navigation: 'harvesters' },
  { icon: '/images/transport.png', name: 'Transport', navigation: 'transport' },
  { icon: '/images/worker.png', name: 'Workers', navigation: 'workers' },
  { icon: '/images/borewell.png', name: 'Borewell', navigation: 'borewell' },
  { icon: '/images/jcb.png', name: 'JCB', navigation: 'jcb' },
  { icon: '/images/centring.png', name: 'Centring', navigation: 'centring' },
  { icon: '/images/digger.png', name: 'Soil Digger', navigation: 'digger' }
];

   services = [
    {
      name: 'Mahindra Tractor 575 DI',
      rating: 4.8,
      distance: '2 km',
      owner: 'Ramesh',
      price: 800,
      image:
        'https://images.unsplash.com/photo-1500937386664-56d1dfef3854?w=800'
    },
    {
      name: 'Harvesting Machine',
      rating: 4.9,
      distance: '5 km',
      owner: 'Suresh',
      price: 2500,
      image:
        'https://images.unsplash.com/photo-1500382017468-9049fed747ef?w=800'
    },
    {
      name: 'Transport Vehicle',
      rating: 4.7,
      distance: '7 km',
      owner: 'Kiran',
      price: 1200,
      image:
        'https://images.unsplash.com/photo-1519003722824-194d4455a60c?w=800'
    }
  ];

}
