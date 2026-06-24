import { CommonModule } from '@angular/common';
import { ChangeDetectorRef, Component, inject, OnDestroy, OnInit, ViewChild } from '@angular/core';
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
import { AdvertisementApiService } from '../../../api-services/advertisement-api-service';
import { DomSanitizer, SafeResourceUrl } from '@angular/platform-browser';

type AdvertisementMedia = {
  type?: string;
  url?: string;
  resourceType?: string;
};

type Advertisement = {
  title?: string;
  adType?: 'photo' | 'video' | 'social' | string;
  targetLink?: string;
  notes?: string;
  media?: AdvertisementMedia[];
  socialMedia?: { url?: string }[];
};

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
export class Homecomponent implements OnInit, OnDestroy {
  properties: any[] = [];
  filteredProperties: any[] = [];
  topAd: Advertisement | null = null;
  adsQueue: Advertisement[] = [];
  currentAdIndex = 0;
  private readonly adBatchSize = 5;
  private readonly adDisplayMs = 30000;
  private readonly maxAdDisplayMs = 60000;
  private adTimer?: ReturnType<typeof setTimeout>;
  private isFetchingAds = false;
  private adPage = 1;
  private hasNextAdPage = true;
  private lastAdCoords: { lat: number; lng: number } | null = null;
  isAdMuted = false;
  realEstateApiSrv = inject(RealEstateApiService);
  advertiseApiSrv = inject(AdvertisementApiService);
  sanitizer = inject(DomSanitizer);
  destroy$ = new Subject<void>();
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
  center: google.maps.LatLngLiteral = CITY_COORDINATES['Hyderabad'];
  zoom: number = 12;
  showFilters: boolean = false;
  quickLinks = [
    { label: 'Services', icon: 'handyman', route: '/services/home' },
    { label: 'Profile', icon: 'person', route: '/profile' },
    { label: 'Post Property', icon: 'add_home', route: '/ad-post' },
    { label: 'My Posts', icon: 'dashboard', route: '/dashboard/my-posts' },
     { label: 'Filters', icon: 'filter_list', action: 'filters' },
  ];

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

  closeFilters() {
  this.showFilters = false;
}

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
        error: (err) => {
          console.error('API ERROR', err);
          this.toastr.error('Something went wrong', 'Fail');
          this.loaderService.hide();
        },
      });
  }

  getAdvertisements(lat: any, lng: any) {
    if (this.isFetchingAds) {
      return;
    }

    this.isFetchingAds = true;
    this.lastAdCoords = { lat, lng };
    const params = {
      longitude: lng,
      latitude: lat,
      limit: this.adBatchSize,
      page: this.adPage,
    }
    this.advertiseApiSrv.get('client-advertisements/active', params)
    .pipe(takeUntil(this.destroy$))
    .subscribe({
      next : (res:any) => {
        const ads = Array.isArray(res) ? res : res?.ads || res?.data;
        const normalizedAds = Array.isArray(ads) ? ads : ads ? [ads] : [];
        this.hasNextAdPage = !!res?.pagination?.hasNextPage;
        this.adPage = (res?.pagination?.page || this.adPage) + 1;
        this.applyAdvertisements(normalizedAds);
        this.isFetchingAds = false;
        this.cdr.detectChanges();
      },
      error: () => {
        this.isFetchingAds = false;
      },
    })
  }

  private applyAdvertisements(ads: Advertisement[]): void {
    this.adsQueue = ads;
    this.currentAdIndex = 0;
    this.topAd = this.adsQueue[this.currentAdIndex] || null;
    this.scheduleCurrentAd();
  }

  private scheduleCurrentAd(durationMs = this.adDisplayMs): void {
    if (this.adTimer) {
      clearTimeout(this.adTimer);
    }

    if (!this.adsQueue.length) {
      return;
    }

    this.adTimer = setTimeout(() => {
      this.showNextAdvertisement();
    }, durationMs);
  }

  onAdVideoMetadata(event: Event): void {
    const video = event.target as HTMLVideoElement;
    const duration = Number.isFinite(video.duration) ? video.duration * 1000 : this.maxAdDisplayMs;
    const displayMs = Math.min(Math.max(duration, this.adDisplayMs), this.maxAdDisplayMs);
    this.scheduleCurrentAd(displayMs);
  }

  onAdVideoEnded(): void {
    this.showNextAdvertisement();
  }

  toggleAdVolume(video: HTMLVideoElement): void {
    this.isAdMuted = !this.isAdMuted;
    video.muted = this.isAdMuted;
    video.volume = this.isAdMuted ? 0 : 1;
  }

  private showNextAdvertisement(): void {
    if (this.adTimer) {
      clearTimeout(this.adTimer);
      this.adTimer = undefined;
    }

    if (!this.adsQueue.length) {
      this.topAd = null;
      return;
    }

    this.currentAdIndex += 1;

    if (this.currentAdIndex >= this.adsQueue.length) {
      this.adsQueue = [];
      this.currentAdIndex = 0;
      this.topAd = null;

      if (!this.hasNextAdPage) {
        this.cdr.detectChanges();
        return;
      }

      if (this.lastAdCoords) {
        this.getAdvertisements(this.lastAdCoords.lat, this.lastAdCoords.lng);
      }
      return;
    }

    this.topAd = this.adsQueue[this.currentAdIndex] || null;
    this.isAdMuted = false;
    this.scheduleCurrentAd(this.isEmbeddableUrlAd(this.topAd) ? this.maxAdDisplayMs : this.adDisplayMs);

    this.cdr.detectChanges();
  }

  getAdMediaUrl(ad: Advertisement | null): string {
    return ad?.media?.[0]?.url || '';
  }

  isImageAd(ad: Advertisement | null): boolean {
    const media = ad?.media?.[0];
    return !!media?.url && (media.type === 'image' || media.resourceType === 'image' || ad?.adType === 'photo');
  }

  isVideoAd(ad: Advertisement | null): boolean {
    const media = ad?.media?.[0];
    return !!media?.url && (media.type === 'video' || media.resourceType === 'video');
  }

  getAdLink(ad: Advertisement | null): string {
    return ad?.targetLink || ad?.socialMedia?.[0]?.url || '';
  }

  hasExternalAdLink(ad: Advertisement | null): boolean {
    return !!this.getAdLink(ad);
  }

  isEmbeddableUrlAd(ad: Advertisement | null): boolean {
    return !!this.getSafeAdEmbedUrl(ad);
  }

  getSafeAdEmbedUrl(ad: Advertisement | null): SafeResourceUrl | null {
    const embedUrl = this.toEmbedUrl(this.getAdLink(ad));
    return embedUrl ? this.sanitizer.bypassSecurityTrustResourceUrl(embedUrl) : null;
  }

  private toEmbedUrl(url: string): string {
    if (!url) {
      return '';
    }

    try {
      const parsedUrl = new URL(url);
      const host = parsedUrl.hostname.replace(/^www\./, '');

      if (host === 'youtu.be') {
        return `https://www.youtube.com/embed/${parsedUrl.pathname.replace('/', '')}?autoplay=1&mute=0&controls=0&rel=0&modestbranding=1&playsinline=1`;
      }

      if (host.includes('youtube.com')) {
        const pathParts = parsedUrl.pathname.split('/').filter(Boolean);
        const shortsIndex = pathParts.indexOf('shorts');
        const videoId =
          parsedUrl.searchParams.get('v') ||
          (shortsIndex >= 0 ? pathParts[shortsIndex + 1] : pathParts.pop());
        return videoId
          ? `https://www.youtube.com/embed/${videoId}?autoplay=1&mute=0&controls=0&rel=0&modestbranding=1&playsinline=1`
          : url;
      }

      if (host.includes('vimeo.com')) {
        const videoId = parsedUrl.pathname.split('/').filter(Boolean).pop();
        return videoId ? `https://player.vimeo.com/video/${videoId}?autoplay=1&muted=0&controls=0` : url;
      }

      if (/\.(mp4|webm|ogg)(\?.*)?$/i.test(parsedUrl.pathname)) {
        return url;
      }

      return url;
    } catch {
      return '';
    }
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
      this.center = CITY_COORDINATES['Hyderabad'];
      this.zoom = 12;
    } else {
      let coords = CITY_COORDINATES[city];
      if (!coords) return;
      this.center = {
          lat: coords.lat,
          lng: coords.lng
        };
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
        this.getAdvertisements(lat,lng);
      },
      (error) => {
        console.error('Location Error:', error);
        // If user denies permission or location fails
        this.center = CITY_COORDINATES['Hyderabad'];
        this.zoom = 12;
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

  toggleFilters(): void {
    this.showFilters = !this.showFilters;
  }

  hasMapCoordinates(property: any): boolean {
    return (
      property?.location?.geoLocation?.coordinates?.[1] != null &&
      property?.location?.geoLocation?.coordinates?.[0] != null
    );
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();

    if (this.adTimer) {
      clearTimeout(this.adTimer);
    }
  }
}
