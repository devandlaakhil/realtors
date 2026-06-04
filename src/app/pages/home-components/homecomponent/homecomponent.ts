import { CommonModule } from '@angular/common';
import { ChangeDetectorRef, Component, inject, OnInit, ViewChild } from '@angular/core';
import { RouterModule } from '@angular/router';
import { ToastrService } from 'ngx-toastr';
import { Subject, takeUntil } from 'rxjs';
import { RealEstateApiService } from '../../../api-services/realestate-api-services';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { FormControl, ReactiveFormsModule } from '@angular/forms';
import { AuthService } from '../../../auth-services/auth-services';
import { TranslatePipe } from '../../../pipes/translatepipe-pipe';
import { Location } from '../../../constants/enums/ad-posting-enums';
import { CITY_COORDINATES } from '../../../constants/location-coordinates';
import { LoaderServices } from '../../../shared-services/loader-services';
import { GoogleMapsModule } from '@angular/google-maps';
import { GoogleMap, MapMarker, MapInfoWindow } from '@angular/google-maps';

@Component({
  selector: 'app-homecomponent',
  imports: [
    CommonModule,
    ReactiveFormsModule,
    RouterModule,
    MatFormFieldModule,
    MatInputModule,
    MatSelectModule,
    MatButtonModule,
    MatIconModule,
    TranslatePipe,
    GoogleMapsModule,
    GoogleMap,
    MapMarker,
    MapInfoWindow,
  ],
  templateUrl: './homecomponent.html',
  styleUrl: './homecomponent.css',
})
export class Homecomponent implements OnInit {
  properties: any[] = [];
  filteredProperties: any[] = [];
  realEstateApiSrv = inject(RealEstateApiService);
  destroy$ = new Subject<any>();
  toastr = inject(ToastrService);
  cdr = inject(ChangeDetectorRef);
  selectedType: string = '';
  selectedBudget: string = '';
  searchControl = new FormControl('');
  searchEntered: boolean = false;
  authService = inject(AuthService);
  userId: string = '';
  cities = Object.values(Location);
  loaderService = inject(LoaderServices);
  center: any;
  zoom: number = 0;

  selectedProperty: any;
  @ViewChild(MapInfoWindow)
  infoWindow!: MapInfoWindow;

  ngOnInit(): void {
    this.userId = this.authService.getUser()?.id;
    this.loadProperties();
  }

  mapOptions: google.maps.MapOptions = {
    disableDefaultUI: true,
    zoomControl: true,
    streetViewControl: false,
    mapTypeControl: false,
    fullscreenControl: false,
  };

  getAllProperites(lat?: number, lng?: number): void {
    this.loaderService.show();
    this.realEstateApiSrv
      .getAllList(lat, lng)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (res) => {
          this.properties = res.data;
          this.filteredProperties = [...this.properties];
          this.setupSearch();
          this.cdr.detectChanges();
          this.loaderService.hide();
        },
        error: () => {
          this.toastr.error('Something went wrong', 'Fail');
          this.loaderService.hide();
        },
      });
  }

  setupSearch() {
    this.searchControl.valueChanges.subscribe((value) => {
      const searchText = (value || '').toLowerCase().trim();
      searchText != '' ? (this.searchEntered = true) : (this.searchEntered = false);
      this.filteredProperties = this.properties.filter(
        (property) =>
          property.title?.toLowerCase().includes(searchText) ||
          property.location?.city?.toLowerCase().includes(searchText) ||
          property.location?.area?.toLowerCase().includes(searchText) ||
          property.propertyType?.toLowerCase().includes(searchText) ||
          property.status?.toLowerCase().includes(searchText),
      );
    });
  }

  getMainImage(images: any[]): string {
    if (!images || images.length === 0) {
      return '';
    }
    const mainImage = images.find((img) => img.type === 'main');
    const image = mainImage?.url || images[0]?.url;
    return image;
  }

  onTypeChange(type: string) {
    this.selectedType = type;
    this.selectedType != '' || this.selectedBudget != ''
      ? this.searchControl.disable()
      : this.searchControl.enable();
    this.filterProperties();
  }

  onBudgetChange(budget: string) {
    this.selectedBudget = budget;
    this.selectedBudget != '' || this.selectedType != ''
      ? this.searchControl.disable()
      : this.searchControl.enable();
    this.filterProperties();
  }

  filterProperties() {
    this.filteredProperties = this.properties.filter((property: any) => {
      // Property Type Filter
      const matchesType =
        !this.selectedType ||
        property.propertyType?.toLowerCase() === this.selectedType.toLowerCase();
      // Budget Filter
      const priceInLakhs = property.price / 100000; // convert to Lakhs
      let matchesBudget = true;
      switch (this.selectedBudget) {
        case '10-50':
          matchesBudget = priceInLakhs >= 10 && priceInLakhs <= 50;
          break;
        case '50-100':
          matchesBudget = priceInLakhs > 50 && priceInLakhs <= 100;
          break;
        case '100+':
          matchesBudget = priceInLakhs > 100;
          break;
      }
      return matchesType && matchesBudget;
    });
  }

  onLocationChange(city: string): void {
    if (city == '') {
      this.getAllProperites();
    } else {
      const coords = CITY_COORDINATES[city];
      this.getAllProperites(coords.lat, coords.lng);
    }
  }

  loadProperties(): void {
    if (!navigator.geolocation) {
      console.warn('Geolocation is not supported by this browser.');
      this.getAllProperites();
      return;
    }

    navigator.geolocation.getCurrentPosition(
      (position) => {
        const lat = position.coords.latitude;
        const lng = position.coords.longitude;
        // Update map center
        this.center = {
          lat,
          lng,
        };
        this.zoom = 15;
        this.getAllProperites(lat, lng);
      },
      (error) => {
        console.error('Location Error:', error);

        // If user denies permission or location fails
        this.getAllProperites();
      },
      {
        enableHighAccuracy: true,
        timeout: 10000,
        maximumAge: 60000,
      },
    );
  }

  openInfo(marker: MapMarker, property: any) {
    this.selectedProperty = property;
    this.infoWindow.open(marker);
  }
}
