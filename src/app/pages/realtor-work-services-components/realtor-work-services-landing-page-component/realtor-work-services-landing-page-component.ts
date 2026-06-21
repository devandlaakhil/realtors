import { CommonModule } from '@angular/common';
import { Component, inject } from '@angular/core';
import { RouterModule } from '@angular/router';
import { TranslatePipe } from '../../../pipes/translatepipe-pipe';
import { LoaderServices } from '../../../shared-services/loader-services';
import { forkJoin } from 'rxjs';
import { RealtorsServicesApiServices } from '../../../api-services/realtors-services-api-services';
import { WorkerApiServices } from '../../../api-services/worker-api-services';
import { API_CONSTANTS } from '../../../constants/realtors-services-api-constants';
import { mapTractor, mapVehicle, mapWorker } from '../../../constants/service-mappers';
import { MapComponent } from '../../shared-components/map-component/map-component';
import { mapToServiceCard } from './homeScreen-mapper';
import { MobileDialpadService } from '../../../shared-services/mobile-dialpad-service';
import { TransportApiService } from '../../../api-services/transport-api-service';
import { CITY_COORDINATES } from '../../../constants/location-coordinates';

@Component({
  selector: 'app-realtor-work-services-landing-page-component',
  imports: [CommonModule, RouterModule, TranslatePipe, MapComponent],
  templateUrl: './realtor-work-services-landing-page-component.html',
  styleUrl: './realtor-work-services-landing-page-component.css',
})
export class RealtorWorkServicesLandingPageComponent {
  loaderSrv = inject(LoaderServices);
  realtorApiSrv = inject(RealtorsServicesApiServices);
  workerApiSrv = inject(WorkerApiServices);
  vehiclesApiSrv = inject(TransportApiService);
  
  serviceGroups: any[] = [];
  selectedLocation: any = { ...CITY_COORDINATES['Hyderabad'] };
  phoneCall = inject(MobileDialpadService);
  mapServices: any[] = [];

  categories = [
    { icon: '/images/tractor.png', name: 'Tractors', navigation: 'tractor' },
    { icon: '/images/worker.png', name: 'Workers', navigation: 'workers' },
    { icon: '/images/transport.png', name: 'Transport', navigation: 'transport' },
    { icon: '/images/centring.png', name: 'Centring', navigation: 'centring' },
    { icon: '/images/hardware.png', name: 'Hardware', navigation: 'hardware' },
    { icon: '/images/realtors.png', name: 'All Services', navigation: 'home' },
  ];
  footerServices = this.categories;
  services: any[] = [];

  ngOnInit(): void {
    this.getCurrentLocation();
  }

  getCurrentLocation(): void {
    if (!navigator.geolocation) {
      this.loadAllServices();
      return;
    }

    navigator.geolocation.getCurrentPosition(
      (position) => {
        this.selectedLocation = {
          lat: position.coords.latitude,
          lng: position.coords.longitude,
        };
        this.loadAllServices();
      },
      () => {
        this.selectedLocation = { ...CITY_COORDINATES['Hyderabad'] };
        this.loadAllServices();
      },
      { enableHighAccuracy: true, timeout: 8000, maximumAge: 60000 },
    );
  }

  loadAllServices() {
    this.loaderSrv.show();
    forkJoin({
      tractors: this.realtorApiSrv.get(API_CONSTANTS.tractorServices.list, this.selectedLocation),
      workers: this.workerApiSrv.get(
        API_CONSTANTS.workerapiServices.getMyPostings,
        this.selectedLocation,
      ),
      vehicles: this.vehiclesApiSrv.get(API_CONSTANTS.transportApiService.getNearByVehicles,this.selectedLocation),
      // cultivators: this.api.get('/cultivators'),
    }).subscribe({
      next: (res: any) => {
        this.serviceGroups = [
          {
            category: 'Tractors',
            icon: '🚜',
            items: (res.tractors?.data || []).map((x: any) => mapTractor(x)),
          },
          {
            category: 'workers',
            icon: '👷‍♂️',
            items: (res.workers?.data || []).map((x: any) => mapWorker(x)),
          },
          {
            category: 'Vehicles',
            icon: '🚛',
            items: (res.vehicles?.data || []).map((x:any) => mapVehicle(x) ),
          },
          // {
          //   category: 'Cultivators',
          //   icon: '🛠️',
          //   items: res.cultivators.data,
          // },
        ].filter((group) => group.items?.length);
        this.services = this.serviceGroups.flatMap((group) =>
          group.items.map((item: any) => mapToServiceCard(item, group.category)),
        );
        this.mapService();
        this.loaderSrv.hide();
      },
      error: () => {
        this.loaderSrv.hide();
      },
    });
  }

  mapService() {
    this.mapServices = this.serviceGroups
      .flatMap((group: any) =>
        group.items.map((item: any) => {
          let coordinates: number[] | null = null;

          // Worker
          if (item.originalData?.location?.coordinates) {
            coordinates = item.originalData.location.coordinates;
          }

          // Tractor
          if (item.originalData?.location?.coordinates?.coordinates) {
            coordinates = item.originalData.location.coordinates.coordinates;
          }

          return {
            id: item.id,
            name: item.title,
            image: item.image,
            price: item.price,
            unit: item.unit,
            mobile: item.mobile,
            category: group.category,
            lat: coordinates?.[1],
            lng: coordinates?.[0],
          };
        }),
      )
      .filter((x) => x.lat && x.lng);
  }
}
