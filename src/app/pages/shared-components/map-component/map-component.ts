import { CommonModule } from '@angular/common';
import {
  ChangeDetectorRef,
  Component,
  EventEmitter,
  inject,
  Input,
  OnInit,
  Output,
  SimpleChanges,
  ViewChild,
} from '@angular/core';
import { GoogleMapsModule } from '@angular/google-maps';
import { GoogleMap, MapInfoWindow, MapMarker } from '@angular/google-maps';

@Component({
  selector: 'app-map-component',
  imports: [CommonModule, GoogleMapsModule, GoogleMap, MapInfoWindow, MapMarker],
  templateUrl: './map-component.html',
  styleUrl: './map-component.css',
})
export class MapComponent implements OnInit {
  selectedLocation: any = { lat: '', lng: '' };
  zoom: number = 0;
  onDataChange = Output();
  cdr = inject(ChangeDetectorRef);
  selectedItem: any = null;
  markers: any[] = [];

  @Input() data: any[] = [];
  @Input() center: any;
  // @Input() selectedItem: any;
  @Input() dragble: boolean = true;
  @Input() showMap: boolean = false;

  @Output() locationSelected = new EventEmitter<{ lat: number; lng: number }>();

  @ViewChild(MapInfoWindow)
  infoWindow!: MapInfoWindow;

  @ViewChild(GoogleMap)
  map!: GoogleMap;

  ngOnInit(): void {
    this.getCurrentLocation();
  }

  ngOnChanges(changes: SimpleChanges): void {
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

  getCurrentLocation(): void {
    if (!navigator.geolocation) {
      return;
    }

    navigator.geolocation.getCurrentPosition(
      (position) => {
        const lat = position.coords.latitude;
        const lng = position.coords.longitude;

        this.center = { lat, lng };

        this.selectedLocation = {
          lat,
          lng,
        };

        // Send current location to parent
        this.locationSelected.emit({
          lat,
          lng,
        });
      },
      (error) => {
        console.error('Location Error:', error);
      },
      {
        enableHighAccuracy: true,
      },
    );
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
      workers: '/images/worker.png',
      Vehicles: '/images/transport.png',
      // Cultivator: '/images/cultivator.png',
    };

    return icons[category] || '/images/markers/default-marker.png';
  }
}
