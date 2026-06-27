import { CommonModule } from '@angular/common';
import {
  ChangeDetectorRef,
  Component,
  EventEmitter,
  inject,
  Input,
  OnChanges,
  OnInit,
  Output,
  SimpleChanges,
  ViewChild,
} from '@angular/core';
import { GoogleMapsModule } from '@angular/google-maps';
import { GoogleMap, MapInfoWindow, MapMarker } from '@angular/google-maps';
import { CITY_COORDINATES } from '../../../constants/location-coordinates';
import { Capacitor } from '@capacitor/core';
import { Geolocation } from '@capacitor/geolocation';

@Component({
  selector: 'app-map-component',
  imports: [CommonModule, GoogleMapsModule, GoogleMap, MapInfoWindow, MapMarker],
  templateUrl: './map-component.html',
  styleUrl: './map-component.css',
})
export class MapComponent implements OnInit, OnChanges {
  selectedLocation: google.maps.LatLngLiteral | null = null;
  defaultCenter: google.maps.LatLngLiteral = CITY_COORDINATES['Hyderabad'];
  zoom: number = 13;
  onDataChange = Output();
  cdr = inject(ChangeDetectorRef);
  selectedItem: any = null;
  markers: any[] = [];

  @Input() data: any[] = [];
  @Input() center?: google.maps.LatLngLiteral;
  // @Input() selectedItem: any;
  @Input() dragble: boolean = true;
  @Input() showMap: boolean = false;

  @Output() locationSelected = new EventEmitter<{ lat: number; lng: number }>();

  @ViewChild(MapInfoWindow)
  infoWindow!: MapInfoWindow;

  @ViewChild(GoogleMap)
  map!: GoogleMap;

  async ngOnInit(): Promise<void> {
    if (this.center?.lat != null && this.center?.lng != null) {
      this.applyCurrentLocation(this.center.lat, this.center.lng);
      return;
    }

    await this.getCurrentLocation();
  }

  ngOnChanges(changes: SimpleChanges): void {
    const suppliedCenter = changes['center']?.currentValue as
      | google.maps.LatLngLiteral
      | undefined;

    if (suppliedCenter?.lat != null && suppliedCenter?.lng != null) {
      this.center = { lat: Number(suppliedCenter.lat), lng: Number(suppliedCenter.lng) };
      this.selectedLocation = this.center;
      this.zoom = 15;
    }

    if (!changes['data']?.currentValue) return;

    this.markers = this.data
      .map((item: any) => {
        const lat = item?.location?.coordinates?.[1] ?? item?.lat;
        const lng = item?.location?.coordinates?.[0] ?? item?.lng;

        if (lat == null || lng == null) {
          return null;
        }

        return {
          ...item,
          lat: Number(lat),
          lng: Number(lng),
          markerOptions: {
            icon: {
              url: this.getMarkerIcon(item.category),
              scaledSize: new google.maps.Size(40, 40),
            },
          },
        };
      })
      .filter(Boolean);
  }

  async getCurrentLocation(): Promise<void> {
    try {
      const position = Capacitor.isNativePlatform()
        ? await this.getNativePosition()
        : await this.getBrowserPosition();

      this.applyCurrentLocation(position.coords.latitude, position.coords.longitude);
    } catch (error) {
      console.error('Location Error:', error);
    }
  }

  private async getNativePosition(): Promise<{ coords: { latitude: number; longitude: number } }> {
    const currentPermission = await Geolocation.checkPermissions();
    let locationPermission = currentPermission.location;

    if (locationPermission !== 'granted') {
      const requestedPermission = await Geolocation.requestPermissions();
      locationPermission = requestedPermission.location;
    }

    if (locationPermission !== 'granted') {
      throw new Error('Location permission denied');
    }

    return Geolocation.getCurrentPosition({
      enableHighAccuracy: true,
      timeout: 15000,
      maximumAge: 10000,
    });
  }

  private getBrowserPosition(): Promise<GeolocationPosition> {
    return new Promise((resolve, reject) => {
      if (!navigator.geolocation) {
        reject(new Error('Browser geolocation is unavailable'));
        return;
      }

      navigator.geolocation.getCurrentPosition(resolve, reject, {
        enableHighAccuracy: true,
        timeout: 15000,
        maximumAge: 10000,
      });
    });
  }

  private applyCurrentLocation(lat: number, lng: number): void {
    this.center = { lat: Number(lat), lng: Number(lng) };
    this.selectedLocation = this.center;
    this.zoom = 15;
    this.locationSelected.emit(this.center);
    this.cdr.detectChanges();
  }

  markerDragged(event: google.maps.MapMouseEvent): void {
    if (!event.latLng) return;

    const lat = event.latLng.lat();
    const lng = event.latLng.lng();

    this.selectedLocation = {
      lat,
      lng,
    };

    this.locationSelected.emit({
      lat,
      lng,
    });
  }

  onMapClick(event: google.maps.MapMouseEvent): void {
    if (!event.latLng) return;

    const lat = event.latLng.lat();
    const lng = event.latLng.lng();

    this.selectedLocation = {
      lat,
      lng,
    };

    this.locationSelected.emit({
      lat,
      lng,
    });
  }

  openInfo(marker: MapMarker, worker: any): void {
    this.selectedItem = worker;
    this.infoWindow.open(marker);
  }

  getMarkerIcon(category: string): string {
    const icons: Record<string, string> = {
      Tractors: '/images/tractor.png',
      Workers: '/images/worker.png',
      workers: '/images/worker.png',
      Vehicles: '/images/transport.png',
      // Cultivator: '/images/cultivator.png',
    };

    return icons[category] || '/images/markers/default-marker.png';
  }
}
