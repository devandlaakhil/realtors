import { CommonModule } from '@angular/common';
import {
  ChangeDetectorRef,
  Component,
  EventEmitter,
  inject,
  Input,
  OnInit,
  Output,
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

  ngOnChanges() {
    if (!this.data?.length || !this.map) return;

    const bounds = new google.maps.LatLngBounds();

    this.data.forEach((worker) => {
      bounds.extend({
        lat: worker.location.coordinates[1],
        lng: worker.location.coordinates[0],
      });
    });

    bounds.extend(this.selectedLocation);
    this.map.fitBounds(bounds);
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
}
