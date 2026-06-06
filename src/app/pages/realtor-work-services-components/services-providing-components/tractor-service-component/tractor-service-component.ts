import { CommonModule } from '@angular/common';
import { Component, inject, OnInit } from '@angular/core';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatCheckboxChange, MatCheckboxModule } from '@angular/material/checkbox';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { RealtorsServicesApiServices } from '../../../../api-services/realtors-services-api-services';
import { Subject, takeUntil } from 'rxjs';
import { API_CONSTANTS } from '../../../../constants/realtors-services-api-constants';
import { ToastrService } from 'ngx-toastr';
import { GoogleMap, MapMarker } from '@angular/google-maps';
import { LoaderServices } from '../../../../shared-services/loader-services';

@Component({
  selector: 'app-tractor-service-component',
  imports: [
    CommonModule,
    MatFormFieldModule,
    MatInputModule,
    MatSelectModule,
    MatCheckboxModule,
    MatButtonModule,
    MatCardModule,
    ReactiveFormsModule,
    GoogleMap,
    MapMarker,
  ],
  templateUrl: './tractor-service-component.html',
  styleUrl: './tractor-service-component.css',
})
export class TractorServiceComponent implements OnInit {
  showPostServiceForm = false;
  tractorForm!: FormGroup;
  fb = inject(FormBuilder);
  selectedImages: File[] = [];
  realtorsApiSrv = inject(RealtorsServicesApiServices);
  destroy$ = new Subject<any>();
  toastr = inject(ToastrService);
  loaderService = inject(LoaderServices);
  showMap: boolean = false;
  zoom: number = 0;
  selectedLocation: any = { lat: '', lng: '' };
  center: any;

  ngOnInit(): void {
    this.initializeForm();
    this.getCurrentLocation();
  }

  initializeForm(): void {
    this.tractorForm = this.fb.group({
      // Owner Details
      ownerDetails: this.fb.group({
        ownerName: ['', Validators.required],
        mobileNumber: ['', [Validators.required, Validators.pattern(/^[0-9]{10}$/)]],
        whatsappNumber: [''],
      }),
      // Tractor Details
      tractorDetails: this.fb.group({
        title: ['', Validators.required],
        brand: ['', Validators.required],
        model: ['', Validators.required],
        horsePower: [null],
        manufacturingYear: [null],
        registrationNumber: [''],
      }),
      // Pricing
      pricing: this.fb.group({
        pricePerHour: [null, Validators.required],
        pricePerAcre: [null],
        minimumBookingHours: [1],
      }),
      // Location
      location: this.fb.group({
        address: [''],
        village: ['', Validators.required],
        mandal: [''],
        district: ['', Validators.required],
        state: ['', Validators.required],
        pincode: [''],
        latitude: [null],
        longitude: [null],
        geoLocation: this.fb.group({
          type: ['Point'],
          coordinates: [[]],
        }),
      }),
      // Features
      features: this.fb.group({
        includesDriver: [false],
        fuelIncluded: [false],
        rotavatorAvailable: [false],
        cultivatorAvailable: [false],
        trailerAvailable: [false],
      }),
      // Availability
      availability: this.fb.group({
        isAvailable: [true],
        availableFrom: [null],
        availableTo: [null],
      }),
      // Description
      description: [''],
      // Images
      images: [],
    });
  }

  openPostService() {
    this.showPostServiceForm = true;
  }

  closePostService() {
    this.showPostServiceForm = false;
  }

  private getCurrentLocation(showMap = false): void {
    navigator.geolocation.getCurrentPosition(
      (position) => {
        const lat = position.coords.latitude;
        const lng = position.coords.longitude;

        this.center = { lat, lng };

        this.selectedLocation = { lat, lng };

        this.tractorForm.patchValue({
          location: {
            latitude: lat,
            longitude: lng,
            geoLocation: {
              type: 'Point',
              coordinates: [lng, lat],
            },
          },
        });

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

  onMapsToggle(event: MatCheckboxChange): void {
    if (event.checked) {
      // If location already exists
      if (this.selectedLocation) {
        this.zoom = 15;
        this.showMap = true;

        return;
      }
      // First time location fetch
      this.getCurrentLocation(true);
    } else {
      this.showMap = false;
    }
  }

  markerDragged(event: google.maps.MapMouseEvent) {
    if (!event.latLng) return;
    this.selectedLocation = {
      lat: event.latLng.lat(),
      lng: event.latLng.lng(),
    };

    this.tractorForm.patchValue(
      {
        location: {
          latitude: event.latLng.lat(),
          longitude: event.latLng.lng(),

          geoLocation: {
            type: 'Point',
            coordinates: [this.selectedLocation.lng, this.selectedLocation.lat],
          },
        },
      },
      { emitEvent: false },
    );
  }
  tractors = [
    {
      id: 1,
      name: 'Mahindra 575 DI',
      owner: 'Ramesh',
      price: 800,
      rating: 4.8,
      distance: '2 km',
      image: 'https://picsum.photos/500/300?1',
      top: '20%',
      left: '30%',
    },
    {
      id: 2,
      name: 'Swaraj 744 FE',
      owner: 'Suresh',
      price: 950,
      rating: 4.9,
      distance: '5 km',
      image: 'https://picsum.photos/500/300?2',
      top: '40%',
      left: '70%',
    },
    {
      id: 3,
      name: 'John Deere 5310',
      owner: 'Kiran',
      price: 1100,
      rating: 4.7,
      distance: '7 km',
      image: 'https://picsum.photos/500/300?3',
      top: '70%',
      left: '45%',
    },
    {
      id: 4,
      name: 'Farmtrac 60',
      owner: 'Mahesh',
      price: 750,
      rating: 4.6,
      distance: '10 km',
      image: 'https://picsum.photos/500/300?4',
      top: '25%',
      left: '55%',
    },
  ];

  onImageSelect(event: Event): void {
    const input = event.target as HTMLInputElement;
    if (!input.files?.length) {
      return;
    }
    this.selectedImages = Array.from(input.files);
  }

  saveTractor(): void {
    if (this.tractorForm.invalid) {
      this.tractorForm.markAllAsTouched();
      return;
    }
    this.loaderService.show();
    const formData = new FormData();
    // Form Data
    formData.append('payload', JSON.stringify(this.tractorForm.value));
    // Images
    if (this.selectedImages?.length) {
      this.selectedImages.forEach((file: File) => {
        formData.append('images', file, file.name);
      });
    }
    this.realtorsApiSrv
      .post(API_CONSTANTS.tractorServices.save, formData)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (res) => {
          this.tractorForm.reset();
          this.selectedImages = [];
          this.loaderService.hide();
          this.toastr.success('Successfully posted your service');
        },
        error: () => {
          this.loaderService.hide();
          this.toastr.error('Failed to post your service');
        },
      });
  }

  selectedTractor = this.tractors[0];

  selectTractor(tractor: any) {
    this.selectedTractor = tractor;
  }
}
