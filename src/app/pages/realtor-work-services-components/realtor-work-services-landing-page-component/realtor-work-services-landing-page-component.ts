import { CommonModule } from '@angular/common';
import { Component, HostListener, inject } from '@angular/core';
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
  serviceCategoryCards: any[] = [];
  selectedLocation: any = { ...CITY_COORDINATES['Hyderabad'] };
  selectedService: any = null;
  popoverPosition: { left: number; top: number } | null = null;
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
      workers: this.workerApiSrv.get(API_CONSTANTS.workerapiServices.getAll, this.selectedLocation),
      vehicles: this.vehiclesApiSrv.get(API_CONSTANTS.transportApiService.getNearByVehicles, this.selectedLocation),
    }).subscribe({
      next: (res: any) => {
        this.serviceGroups = [
          {
            category: 'Tractors',
            icon: '/images/tractor.png',
            items: (res.tractors?.data || []).map((x: any) => mapTractor(x)),
          },
          {
            category: 'Workers',
            icon: '/images/worker.png',
            items: (res.workers?.data || []).map((x: any) => mapWorker(x)),
          },
          {
            category: 'Vehicles',
            icon: '/images/transport.png',
            items: (res.vehicles?.data || []).map((x: any) => mapVehicle(x)),
          },
        ].filter((group) => group.items?.length);

        this.services = this.serviceGroups.flatMap((group) =>
          group.items.map((item: any) => mapToServiceCard(item, group.category)),
        );
        this.serviceCategoryCards = this.serviceGroups.map((group) => ({
          category: group.category,
          icon: group.icon,
          items: group.items.map((item: any) => mapToServiceCard(item, group.category)),
        }));
        this.selectedService = null;
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
          const coordinates = this.getServiceCoordinates(item.originalData);

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
      .filter((x) => x.lat != null && x.lng != null);
  }

  getServiceCoordinates(item: any): number[] | null {
    const candidates = [
      item?.location?.coordinates?.coordinates,
      item?.location?.coordinates,
      item?.coordinates?.coordinates,
      item?.coordinates,
      item?.geoLocation?.coordinates,
      item?.location,
    ];

    const coordinatePair = candidates.find(
      (value) => Array.isArray(value) && value.length >= 2 && Number.isFinite(Number(value[0])) && Number.isFinite(Number(value[1])),
    );

    if (coordinatePair) {
      return [Number(coordinatePair[0]), Number(coordinatePair[1])];
    }

    const lat = item?.latitude ?? item?.lat ?? item?.location?.latitude ?? item?.location?.lat;
    const lng = item?.longitude ?? item?.lng ?? item?.location?.longitude ?? item?.location?.lng;

    if (lat != null && lng != null && Number.isFinite(Number(lat)) && Number.isFinite(Number(lng))) {
      return [Number(lng), Number(lat)];
    }

    return null;
  }

  selectService(service: any, event?: Event): void {
    event?.stopPropagation();
    this.selectedService = service;
    this.setPopoverPosition(event);
  }

  @HostListener('document:click')
  closeServicePopover(): void {
    this.selectedService = null;
    this.popoverPosition = null;
  }

  private setPopoverPosition(event?: Event): void {
    const target = event?.currentTarget as HTMLElement | null;

    if (!target) {
      this.popoverPosition = null;
      return;
    }

    const rect = target.getBoundingClientRect();
    const popoverWidth = Math.min(260, window.innerWidth * 0.88);
    const left = Math.min(
      Math.max(rect.left + rect.width / 2, popoverWidth / 2 + 8),
      window.innerWidth - popoverWidth / 2 - 8,
    );
    const top = Math.min(rect.bottom + 8, window.innerHeight - 180);

    this.popoverPosition = { left, top };
  }
}
