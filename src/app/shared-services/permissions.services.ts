import { Injectable } from '@angular/core';
import { Geolocation } from '@capacitor/geolocation';

@Injectable({
  providedIn: 'root',
})
export class PermissionsServices {
  async requestLocationPermission() {
    try {
      return await Geolocation.requestPermissions();
    } catch (error) {
      console.warn('Location permission request failed', error);
      return null;
    }
  }

  async checkLocationPermission() {
    try {
      return await Geolocation.checkPermissions();
    } catch (error) {
      console.warn('Location permission check failed', error);
      return null;
    }
  }

}
