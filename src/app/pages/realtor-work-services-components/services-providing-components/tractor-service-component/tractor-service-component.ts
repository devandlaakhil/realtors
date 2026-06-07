import { CommonModule } from '@angular/common';
import { Component, inject, OnInit, ViewChild } from '@angular/core';
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
import { GoogleMap, MapInfoWindow, MapMarker } from '@angular/google-maps';
import { LoaderServices } from '../../../../shared-services/loader-services';
import { TractorCard } from '../../../../../app/constants/enums/common-interfaces';
import { GoogleMapsModule } from '@angular/google-maps';
import { ActivatedRoute, Router } from '@angular/router';
import { MobileDialpadService } from '../../../../shared-services/mobile-dialpad-service';
import { MatIcon } from '@angular/material/icon';
import { TranslatePipe } from '../../../../pipes/translatepipe-pipe';

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
    MapInfoWindow,
    GoogleMapsModule,
    MatIcon,
    TranslatePipe,
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
  phoneCall = inject(MobileDialpadService);
  route = inject(ActivatedRoute);
  showMap: boolean = false;
  zoom: number = 0;
  selectedLocation: any = { lat: '', lng: '' };
  center: any;
  tractors: TractorCard[] = [];
  selectedTractor: TractorCard | null = null;
  totalAvailTractors: number = 0;
  router = inject(Router);
  expandedTractorId: number | string | null = null;
  isEditMode: boolean = false;
  propertyId: string = '';

  @ViewChild(MapInfoWindow)
  infoWindow!: MapInfoWindow;

  ngOnInit(): void {
    this.route.paramMap.subscribe((params) => {
      const id = params.get('id');

      if (id) {
        this.isEditMode = true;
        this.propertyId = id;
        this.loadProperty(id);
      }
    });
    this.initializeForm();
    this.getCurrentLocation();
  }

  loadProperty(id: string) {
    this.isEditMode = true;
    this.realtorsApiSrv
      .get(API_CONSTANTS.tractorServices.getsingleitem, {
        id: id,
      })
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (res: any) => {
          const tractor = res.data[0];
          this.tractorForm.patchValue({
            ownerDetails: {
              ownerName: tractor.ownerName,
              mobileNumber: tractor.mobileNumber,
              whatsappNumber: tractor.whatsappNumber,
            },
            tractorDetails: {
              title: tractor.title,
              brand: tractor.brand,
              model: tractor.model,
              horsePower: tractor.horsePower,
              manufacturingYear: tractor.manufacturingYear,
              registrationNumber: tractor.registrationNumber,
            },
            pricing: {
              pricePerHour: tractor.pricePerHour,
              pricePerAcre: tractor.pricePerAcre,
              minimumBookingHours: tractor.minimumBookingHours,
            },
            location: {
              address: tractor.location?.address,
              village: tractor.location?.village,
              mandal: tractor.location?.mandal,
              district: tractor.location?.district,
              state: tractor.location?.state,
              pincode: tractor.location?.pincode,
              latitude: tractor.location?.coordinates?.coordinates?.[1] ?? null,
              longitude: tractor.location?.coordinates?.coordinates?.[0] ?? null,
              geoLocation: {
                type: tractor.location?.coordinates?.type ?? 'Point',
                coordinates: tractor.location?.coordinates?.coordinates ?? [],
              },
            },
            features: {
              includesDriver: tractor.includesDriver,
              fuelIncluded: tractor.fuelIncluded,
              rotavatorAvailable: tractor.rotavatorAvailable,
              cultivatorAvailable: tractor.cultivatorAvailable,
              trailerAvailable: tractor.trailerAvailable,
            },
            availability: {
              isAvailable: tractor.isAvailable,
              availableFrom: tractor.availableFrom,
              availableTo: tractor.availableTo,
            },
            description: tractor.description,
            images: tractor.images || [],
          });
          if (tractor.location?.coordinates?.coordinates?.length === 2) {
            const [lng, lat] = tractor.location.coordinates.coordinates;
            this.selectedLocation = {
              lat,
              lng,
            };
            this.center = {
              lat,
              lng,
            };
          }
          this.selectedImages = tractor.images || [];
        },
        error: () => {
          this.toastr.error('Something went wrong', 'Fail');
        },
      });
  }

  getAllNearByTractors() {
    this.loaderService.show();
    this.realtorsApiSrv
      .get(API_CONSTANTS.tractorServices.list, this.selectedLocation)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (res: any) => {
          this.totalAvailTractors = res.count;
          this.tractors = res.data.map((tractor: any) => ({
            id: tractor.id,
            name: tractor.title,
            owner: tractor.ownerName,
            price: tractor.pricePerHour,
            rating: tractor.averageRating,
            mobile: tractor.mobileNumber,
            distance: `${tractor.distanceKm} km`,
            village: tractor.location.village,
            district: tractor.location.district,
            registrationNumber: tractor.registrationNumber,
            addOns: [
              tractor.includesDriver && {
                label: 'Driver Included',
                icon: 'person',
              },
              tractor.fuelIncluded && {
                label: 'Fuel Included',
                icon: 'local_gas_station',
              },
              tractor.rotavatorAvailable && {
                label: 'Rotavator',
                icon: 'agriculture',
              },
              tractor.cultivatorAvailable && {
                label: 'Cultivator',
                icon: 'grass',
              },
              tractor.trailerAvailable && {
                label: 'Trailer',
                icon: 'local_shipping',
              },
            ].filter(Boolean),
            image: tractor.images?.[0]?.url || 'assets/images/no-image.png',
            lng: tractor.location.coordinates.coordinates[0],
            lat: tractor.location.coordinates.coordinates[1],
          }));
          this.loaderService.hide();
        },
        error: () => {
          this.loaderService.hide();
          this.toastr.error('Something went wrong', 'Fail');
        },
      });
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
        this.getAllNearByTractors();
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
    formData.append('payload', JSON.stringify(this.tractorForm.value));
    const existingImages = this.selectedImages.filter((img: any) => !(img instanceof File));
    formData.append('existingImages', JSON.stringify(existingImages));
    this.selectedImages.forEach((img: any) => {
      if (img instanceof File) {
        formData.append('images', img, img.name);
      }
    });

    if (!this.isEditMode) {
      this.realtorsApiSrv
        .post(API_CONSTANTS.tractorServices.save, formData)
        .pipe(takeUntil(this.destroy$))
        .subscribe({
          next: () => {
            this.tractorForm.reset();
            this.selectedImages = [];
            this.loaderService.hide();
            this.router.navigate(['/services/home']);
            this.toastr.success('Successfully posted your service');
          },
          error: () => {
            this.loaderService.hide();
            this.toastr.error('Failed to post your service');
          },
        });
    } else {
      formData.append('id', this.propertyId);
      this.realtorsApiSrv
        .put(API_CONSTANTS.tractorServices.updateItem, formData)
        .pipe(takeUntil(this.destroy$))
        .subscribe({
          next: () => {
            this.tractorForm.reset();
            this.selectedImages = [];
            this.loaderService.hide();
            this.router.navigate(['/services/home']);
            this.toastr.success('Successfully updated your service');
          },
          error: () => {
            this.loaderService.hide();
            this.toastr.error('Failed to update your service');
          },
        });
    }
  }

  selectTractor(tractor: TractorCard) {
    this.selectedTractor = tractor;
  }

  openInfo(marker: MapMarker, tractor: TractorCard) {
    this.selectedTractor = tractor;
    this.infoWindow.open(marker);
  }

  toggleDetails(event: Event, tractorId: number | string | null) {
    event.stopPropagation();
    this.expandedTractorId = tractorId;
  }
}
