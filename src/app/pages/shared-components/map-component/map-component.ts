import { CommonModule } from '@angular/common';
import { Component, Input, OnInit, Output } from '@angular/core';
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

  @Input() data: any[] = [];
  @Input() center: any;
  @Input() selectedItem: any;
  @Input() showMap: boolean = false;

  onDataChange = Output();

  ngOnInit(): void {
    this.getCurrentLocation();
  }

  getCurrentLocation(showMap = false): void {
    navigator.geolocation.getCurrentPosition(
      (position) => {
        const lat = position.coords.latitude;
        const lng = position.coords.longitude;
        this.center = { lat, lng };
        this.selectedLocation = { lat, lng };
        // this.tractorForm.patchValue({
        //   location: {
        //     latitude: lat,
        //     longitude: lng,
        //     geoLocation: {
        //       type: 'Point',
        //       coordinates: [lng, lat],
        //     },
        //   },
        // });

        if (showMap) {
          this.zoom = 15;
          this.showMap = true;
        }
      },
      (error) => {
        console.error('Location Error:', error);
      },
      {
        enableHighAccuracy: true,
        timeout: 10000,
        maximumAge: 60000,
      },
    );
  }
  openInfo(marker: any, tractor: any) {
    this.onDataChange.emit({ marker, tractor })
  }
}
