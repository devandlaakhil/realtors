import { CommonModule } from '@angular/common';
import { ChangeDetectorRef, Component, inject, OnDestroy, OnInit } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { MatIconModule } from '@angular/material/icon';
import { ActivatedRoute, Router } from '@angular/router';
import { Subject, takeUntil } from 'rxjs';
import { ToastrService } from 'ngx-toastr';
import { DriverApiServices } from '../../../../api-services/driver-api-services';
import { API_CONSTANTS } from '../../../../constants/realtors-services-api-constants';
import { LoaderServices } from '../../../../shared-services/loader-services';
import { MobileDialpadService } from '../../../../shared-services/mobile-dialpad-service';
import { TranslatePipe } from '../../../../pipes/translatepipe-pipe';
import { ImageUploadComponent } from '../../../shared-components/image-upload-component/image-upload-component';
import { MapComponent } from '../../../shared-components/map-component/map-component';

@Component({
  selector: 'app-drivers-service-component',
  imports: [CommonModule, ReactiveFormsModule, MatIconModule, TranslatePipe, ImageUploadComponent, MapComponent],
  templateUrl: './drivers-service-component.html',
  styleUrl: './drivers-service-component.css',
})
export class DriversServiceComponent implements OnInit, OnDestroy {
  private fb = inject(FormBuilder);
  private api = inject(DriverApiServices);
  private loader = inject(LoaderServices);
  private toastr = inject(ToastrService);
  private route = inject(ActivatedRoute);
  router = inject(Router);
  private cdr = inject(ChangeDetectorRef);
  private destroy$ = new Subject<void>();
  phoneCall = inject(MobileDialpadService);

  drivers: any[] = [];
  mapDrivers: any[] = [];
  expandedId: string | null = null;
  showPostForm = false;
  isEditMode = false;
  driverId = '';
  selectedImage: File | null = null;
  selectedLocation: { lat?: number; lng?: number } = {};
  showLocationMap = false;

  readonly vehicleTypes = [
    '2 Wheeler', '3 Wheeler', '4 Wheeler', '6 Wheeler', '8 Wheeler',
    '10 Wheeler', '12 Wheeler', 'Bus', 'Tractor', 'JCB', 'Crane', 'Other',
  ];
  readonly licenceTypes = ['LMV', 'HMV', 'Transport', 'Commercial', 'Heavy Equipment', 'Other'];

  driverForm = this.fb.group({
    name: ['', Validators.required],
    mobile: ['', [Validators.required, Validators.pattern(/^[0-9]{10}$/)]],
    whatsappNumber: [''],
    vehicleTypes: [<string[]>[], Validators.required],
    licenceType: ['', Validators.required],
    licenceNumber: [''],
    experience: [0, [Validators.required, Validators.min(0)]],
    pricePerDay: [null as number | null, Validators.required],
    pricePerTrip: [null as number | null],
    availableForOutstation: [false],
    availableAtNight: [false],
    hasOwnVehicle: [false],
    village: ['', Validators.required],
    district: ['', Validators.required],
    state: ['', Validators.required],
    languages: [''],
    description: [''],
    latitude: [null as number | null],
    longitude: [null as number | null],
    isActive: [true],
  });

  ngOnInit(): void {
    this.driverId = this.route.snapshot.paramMap.get('id') || '';
    this.isEditMode = !!this.driverId;
    this.showPostForm = this.isEditMode || this.route.snapshot.queryParamMap.get('post') === '1';
    if (this.isEditMode) {
      this.loadDriver();
    } else if (this.showPostForm) {
      this.setDefaultCurrentLocation();
    } else if (!this.showPostForm) {
      this.loader.show();
      this.resolveLocationAndLoad();
    }
  }

  private resolveLocationAndLoad(): void {
    if (!navigator.geolocation) {
      this.loadDrivers();
      return;
    }
    navigator.geolocation.getCurrentPosition(
      ({ coords }) => {
        this.selectedLocation = { lat: coords.latitude, lng: coords.longitude };
        this.loadDrivers();
      },
      () => this.loadDrivers(),
      { enableHighAccuracy: true, timeout: 10000, maximumAge: 60000 },
    );
  }

  private setDefaultCurrentLocation(): void {
    if (!navigator.geolocation) return;
    navigator.geolocation.getCurrentPosition(
      ({ coords }) => this.onLocationSelected({
        lat: coords.latitude,
        lng: coords.longitude,
      }),
      () => undefined,
      { enableHighAccuracy: true, timeout: 10000, maximumAge: 60000 },
    );
  }

  loadDrivers(): void {
    this.api.get<any>(API_CONSTANTS.driverServices.list, this.selectedLocation)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (res) => {
          this.drivers = res?.data || [];
          this.mapDrivers = this.drivers.map((driver) => ({
            ...driver,
            category: 'Drivers',
            price: driver.pricePerDay,
            unit: 'day',
            lat: driver.latitude ?? driver.location?.coordinates?.[1],
            lng: driver.longitude ?? driver.location?.coordinates?.[0],
          }));
          this.loader.hide();
          this.cdr.detectChanges();
        },
        error: () => this.loader.hide(),
      });
  }

  loadDriver(): void {
    this.loader.show();
    this.api.get<any>(API_CONSTANTS.driverServices.getSingleItem, { id: this.driverId })
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (res) => {
          const driver = Array.isArray(res?.data) ? res.data[0] : res?.data;
          if (driver) {
            this.driverForm.patchValue(driver);
            const lat = driver.latitude ?? driver.location?.coordinates?.[1];
            const lng = driver.longitude ?? driver.location?.coordinates?.[0];
            if (lat != null && lng != null) this.selectedLocation = { lat, lng };
          }
          this.loader.hide();
        },
        error: () => this.loader.hide(),
      });
  }

  toggleVehicleType(type: string): void {
    const current = [...(this.driverForm.value.vehicleTypes || [])];
    const next = current.includes(type) ? current.filter((item) => item !== type) : [...current, type];
    this.driverForm.patchValue({ vehicleTypes: next });
  }

  hasVehicleType(type: string): boolean {
    return !!this.driverForm.value.vehicleTypes?.includes(type);
  }

  onImageSelected(file: File | null): void {
    this.selectedImage = file;
  }

  onLocationSelected(location: { lat: number; lng: number }): void {
    this.selectedLocation = location;
    this.driverForm.patchValue({
      latitude: location.lat,
      longitude: location.lng,
    });
  }

  save(): void {
    if (this.driverForm.invalid) {
      this.driverForm.markAllAsTouched();
      this.toastr.warning('Please complete the required driver details.', 'Check details');
      return;
    }
    const formData = new FormData();
    formData.append('payload', JSON.stringify(this.driverForm.value));
    if (this.selectedImage) formData.append('images', this.selectedImage);
    this.loader.show();
    const request = this.isEditMode
      ? this.api.put(API_CONSTANTS.driverServices.updateItem, formData)
      : this.api.post(API_CONSTANTS.driverServices.save, formData);
    request.pipe(takeUntil(this.destroy$)).subscribe({
      next: () => {
        this.loader.hide();
        this.toastr.success('Driver service saved successfully.', 'Success');
        this.router.navigate(['/services/drivers']);
      },
      error: () => this.loader.hide(),
    });
  }

  toggleDetails(id: string): void {
    this.expandedId = this.expandedId === id ? null : id;
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }
}
