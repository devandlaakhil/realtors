import { Injectable } from '@angular/core';
import { Geolocation } from '@capacitor/geolocation';
import { Camera } from '@capacitor/camera';

@Injectable({
  providedIn: 'root',
})
export class PermissionsServices {
  async requestLocationPermission() {
    return await Geolocation.requestPermissions();
  }

  async requestCameraPermission() {
    return await Camera.requestPermissions();
  }

  async checkLocationPermission() {
    return await Geolocation.checkPermissions();
  }

  async checkCameraPermission() {
    return await Camera.checkPermissions();
  }
}
