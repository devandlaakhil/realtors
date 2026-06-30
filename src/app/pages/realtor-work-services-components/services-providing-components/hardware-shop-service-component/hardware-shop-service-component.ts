import { CommonModule } from '@angular/common';
import { Component, HostListener, inject, OnDestroy, OnInit } from '@angular/core';
import { FormBuilder, FormsModule, ReactiveFormsModule, Validators } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { Capacitor } from '@capacitor/core';
import { Geolocation } from '@capacitor/geolocation';
import { ToastrService } from 'ngx-toastr';
import { Subject, takeUntil } from 'rxjs';
import { HardwareShopApiService } from '../../../../api-services/hardware-shop-api-service';
import { LoaderServices } from '../../../../shared-services/loader-services';
import { MobileDialpadService } from '../../../../shared-services/mobile-dialpad-service';
import { ImageUploadComponent } from '../../../shared-components/image-upload-component/image-upload-component';
import { MapComponent } from '../../../shared-components/map-component/map-component';
import { mapToServiceCard } from '../supporting-files/mapCardMapper';
import { getHardwareImage } from '../../../../constants/service-mappers';
import { ActivatedRoute, Router } from '@angular/router';
import { RealtorsServicesApiServices } from '../../../../api-services/realtors-services-api-services';
import { API_CONSTANTS } from '../../../../constants/realtors-services-api-constants';

@Component({
  selector: 'app-hardware-shop-service-component',
  imports: [
    CommonModule,
    FormsModule,
    ReactiveFormsModule,
    MatButtonModule,
    MatCheckboxModule,
    MatFormFieldModule,
    MatIconModule,
    MatInputModule,
    ImageUploadComponent,
    MapComponent,
  ],
  templateUrl: './hardware-shop-service-component.html',
  styleUrl: './hardware-shop-service-component.css',
})
export class HardwareShopServiceComponent implements OnInit, OnDestroy {
  private readonly fb = inject(FormBuilder);
  private readonly api = inject(HardwareShopApiService);
  private readonly loader = inject(LoaderServices);
  private readonly toastr = inject(ToastrService);
  private readonly destroy$ = new Subject<void>();
  readonly phoneCall = inject(MobileDialpadService);
  route = inject(ActivatedRoute);
  router = inject(Router);

  showPostForm = false;
  showMapPicker = false;
  searchText = '';
  expandedShopId: string | null = null;
  selectedImageFile: File | null = null;
  shops: any[] = [];
  mapItems: any[] = [];
  selectedLocation = { lat: 0, lng: 0 };
  locationReady = false;
  locating = false;
  sheetExpanded = false;
  sheetHeight = '60vh';
  private isDragging = false;
  private dragStartY = 0;
  private dragStartHeight = 60;
  isEditMode:boolean = false;
  propertyId:string = '';
  existingItem:any;
  existingImageUrl: string | null = null;

  shopForm = this.fb.group({
    shopName: ['', Validators.required],
    ownerName: ['', Validators.required],
    mobile: ['', [Validators.required, Validators.pattern(/^[0-9]{10}$/)]],
    address: ['', Validators.required],
    village: [''],
    district: [''],
    products: ['', Validators.required],
    openingTime: ['08:00'],
    closingTime: ['20:00'],
    homeDelivery: [false],
    description: [''],
    image: [null as File | string | null],
    latitude: [null as number | null, Validators.required],
    longitude: [null as number | null, Validators.required],
  });

  readonly getShopImage = getHardwareImage;

  ngOnInit(): void {
     this.showPostForm = this.route.snapshot.queryParamMap.get('post') === '1';
     this.route.paramMap.subscribe((params) => {
      const id = params.get('id');

      if (id) {
        this.isEditMode = true;
        this.showPostForm = true;
        this.propertyId = id;
        this.loadProperty(id);
      } else {
        this.getCurrentLocation();
      }
    });
  }

  loadProperty(id: string) {
    this.isEditMode = true;
    this.loader.show();
    this.api
      .SingleShop(API_CONSTANTS.hardwareShopApiService.getSingleShop, { id })
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (res: any) => {
          const responseShop = res?.data ?? res?.shop ?? res;
          const shop = Array.isArray(responseShop) ? responseShop[0] : responseShop;
          const coordinates =
            shop?.location?.coordinates?.coordinates ??
            shop?.location?.coordinates ??
            shop?.coordinates;
          const latitude = Array.isArray(coordinates)
            ? Number(coordinates[1])
            : Number(shop?.latitude ?? shop?.lat);
          const longitude = Array.isArray(coordinates)
            ? Number(coordinates[0])
            : Number(shop?.longitude ?? shop?.lng);

          this.existingItem = shop;
          this.existingImageUrl = getHardwareImage(shop);
          this.shopForm.patchValue({
            shopName: shop.shopName ?? shop.name ?? '',
            ownerName: shop.ownerName ?? '',
            mobile: shop.mobile ?? shop.mobileNumber ?? '',
            address: shop.address ?? '',
            village: shop.village ?? shop.location?.village ?? '',
            district: shop.district ?? shop.location?.district ?? '',
            products: Array.isArray(shop.products) ? shop.products.join(', ') : (shop.products ?? ''),
            openingTime: shop.openingTime ?? '08:00',
            closingTime: shop.closingTime ?? '20:00',
            homeDelivery: shop.homeDelivery ?? false,
            description: shop.description ?? '',
            image: this.existingImageUrl,
            latitude: Number.isFinite(latitude) ? latitude : null,
            longitude: Number.isFinite(longitude) ? longitude : null,
          });

          if (Number.isFinite(latitude) && Number.isFinite(longitude)) {
            this.selectedLocation = { lat: latitude, lng: longitude };
            this.locationReady = true;
          }
          this.loader.hide();
        },
        error: () => {
          this.loader.hide();
          this.toastr.error('Unable to load the hardware shop', 'Fail');
        },
      });
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  get filteredShops(): any[] {
    const query = this.searchText.trim().toLowerCase();
    if (!query) return this.shops;

    return this.shops.filter((shop) =>
      [shop.shopName, shop.ownerName, shop.products, shop.village, shop.district,shop.image.url]
        .filter(Boolean)
        .some((value) => String(value).toLowerCase().includes(query)),
    );
  }

  async getCurrentLocation(): Promise<void> {
    if (this.locating) return;

    this.locating = true;
    try {
      const position = Capacitor.isNativePlatform()
        ? await this.getNativePosition()
        : await this.getBrowserPosition();
      const lat = position.coords.latitude;
      const lng = position.coords.longitude;

      this.selectedLocation = { lat, lng };
      this.locationReady = true;
      this.shopForm.patchValue({ latitude: lat, longitude: lng });
      this.loadShops();
    } catch {
      this.locationReady = false;
      this.toastr.error('Current location could not be detected. Please turn on GPS and try again');
    } finally {
      this.locating = false;
    }
  }

  private async getNativePosition(): Promise<{ coords: { latitude: number; longitude: number } }> {
    const permission = await Geolocation.checkPermissions();
    let locationPermission = permission.location;

    if (locationPermission !== 'granted') {
      const requested = await Geolocation.requestPermissions();
      locationPermission = requested.location;
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

  loadShops(): void {
    this.loader.show();
    this.api
      .getNearby(this.selectedLocation)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (res) => {
          this.shops = res?.data ?? res?.shops ?? [];
          this.mapItems = this.shops.map((shop) => mapToServiceCard(shop, 'hardware'));
          this.loader.hide();
        },
        error: () => {
          this.loader.hide();
          this.toastr.error('Unable to load nearby hardware shops');
        },
      });
  }

  toggleDetails(id: string): void {
    this.expandedShopId = this.expandedShopId === id ? null : id;
  }

  toggleSheet(): void {
    this.sheetExpanded = !this.sheetExpanded;
    this.sheetHeight = this.sheetExpanded ? '100%' : '60vh';
  }

  onDragStart(event: PointerEvent | TouchEvent): void {
    event.preventDefault();
    this.isDragging = true;
    this.dragStartY = 'touches' in event ? event.touches[0].clientY : event.clientY;
    this.dragStartHeight = parseFloat(this.sheetHeight) || 60;
  }

  @HostListener('window:pointermove', ['$event'])
  @HostListener('window:touchmove', ['$event'])
  onDragMove(event: PointerEvent | TouchEvent): void {
    if (!this.isDragging) return;

    const currentY = 'touches' in event ? event.touches[0].clientY : event.clientY;
    const delta = ((this.dragStartY - currentY) / window.innerHeight) * 100;
    const nextHeight = Math.min(Math.max(this.dragStartHeight + delta, 60), 100);
    this.sheetHeight = `${nextHeight}vh`;
    this.sheetExpanded = nextHeight >= 85;
  }

  @HostListener('window:pointerup')
  @HostListener('window:touchend')
  onDragEnd(): void {
    if (!this.isDragging) return;

    this.isDragging = false;
    this.sheetHeight = this.sheetExpanded ? '100%' : '60vh';
  }

  onLocationSelected(location: { lat: number; lng: number }): void {
    this.selectedLocation = location;
    this.locationReady = true;
    this.shopForm.patchValue({ latitude: location.lat, longitude: location.lng });
  }

  async toggleMapPicker(checked: boolean): Promise<void> {
    if (!checked) {
      this.showMapPicker = false;
      return;
    }

    if (!this.locationReady) {
      await this.getCurrentLocation();
    }

    this.showMapPicker = this.locationReady;
  }

  onImageSelected(file: File | null): void {
    this.selectedImageFile = file;
    this.shopForm.patchValue({ image: file });
  }

  publishShop(): void {
    if (this.shopForm.invalid) {
      this.shopForm.markAllAsTouched();
      this.toastr.warning('Please complete all required shop details');
      return;
    }

    const formData = new FormData();
    formData.append('payload', JSON.stringify(this.shopForm.getRawValue()));
    if (this.selectedImageFile) formData.append('images', this.selectedImageFile);

    this.loader.show();
    if (this.isEditMode) {
      formData.append('id', this.propertyId);
    }

    const saveRequest = this.isEditMode ? this.api.update(formData) : this.api.create(formData);
    saveRequest
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: () => {
          this.loader.hide();
          this.toastr.success(
            this.isEditMode ? 'Hardware shop updated successfully' : 'Your hardware shop is now online',
          );
          this.showPostForm = false;
          this.shopForm.reset({ openingTime: '08:00', closingTime: '20:00', homeDelivery: false });
          this.selectedImageFile = null;
          if (this.isEditMode) {
            this.router.navigate(['/dashboard/services']);
          } else {
            this.getCurrentLocation();
          }
        },
        error: () => {
          this.loader.hide();
          this.toastr.error(
            this.isEditMode ? 'Unable to update the hardware shop' : 'Unable to publish the hardware shop',
          );
        },
      });
  }
}
