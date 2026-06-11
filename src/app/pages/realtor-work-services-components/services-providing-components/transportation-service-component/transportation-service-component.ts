import { CommonModule } from '@angular/common';
import { ChangeDetectorRef, Component, HostListener, inject, OnInit } from '@angular/core';
import { TranslatePipe } from '../../../../pipes/translatepipe-pipe';
import { FormBuilder, FormGroup, FormsModule, ReactiveFormsModule } from '@angular/forms';
import { mapCardItems, mapToServiceCard } from '../supporting-files/mapCardMapper';
import { ActivatedRoute, RouterModule } from '@angular/router';
import { MatIcon, MatIconModule } from '@angular/material/icon';
import { MapComponent } from '../../../shared-components/map-component/map-component';
import { ImageUploadComponent } from '../../../shared-components/image-upload-component/image-upload-component';
import { MatLabel } from '@angular/material/form-field';
import { MatSelectModule } from '@angular/material/select';
import { MatCard } from '@angular/material/card';
import { MatInput } from '@angular/material/input';
import { MatButton } from '@angular/material/button';
import { MatCheckbox, MatCheckboxChange } from '@angular/material/checkbox';
import { MobileDialpadService } from '../../../../shared-services/mobile-dialpad-service';
import { ToastrService } from 'ngx-toastr';
import { LoaderServices } from '../../../../shared-services/loader-services';
import { API_CONSTANTS } from '../../../../constants/realtors-services-api-constants';
import { TransportApiService } from '../../../../api-services/transport-api-service';
import { Subject, takeUntil } from 'rxjs';

@Component({
  selector: 'app-transportation-service-component',
  imports: [
    CommonModule,
    TranslatePipe,
    FormsModule,
    ReactiveFormsModule,
    RouterModule,
    FormsModule,
    MatIconModule,
    MapComponent,
    ImageUploadComponent,
    MatLabel,
    MatSelectModule,
    MatCard,
    MatInput,
    MatButton,
    MatCheckbox,
    MatIcon,
    TranslatePipe,
  ],
  templateUrl: './transportation-service-component.html',
  styleUrl: './transportation-service-component.css',
})
export class TransportationServiceComponent implements OnInit {
  searchText: string = '';
  mapCardItems = mapCardItems;
  sheetExpanded = false;
  private isDragging = false;
  private dragStartY = 0;
  private dragStartHeight = 60;
  sheetHeight = '60vh';
  availabilityFilter = 'All';
  vehicles: any[] = [];
  activeCategory = 'All';
  expandedVechileId: string | null = null;
  isEditMode: boolean = false;
  showPostVechileForm = false;
  fb = inject(FormBuilder);
  transportForm!: FormGroup;
  selectedImageFile!: File | null;
  selectedImages: any = [];
  selectedMaterials: string[] = [];
  selectedFacilityOptions: string[] = [];
  selectedLocation: any = { lng: '', lat: '' };
  showMap: boolean = false;
  zoom: number = 0;
  destroy$ = new Subject<any>();
  propertyId: string = '';
  imageUrl = '';

  phoneCall = inject(MobileDialpadService);
  toastSrv = inject(ToastrService);
  loaderSrv = inject(LoaderServices);
  transportApiSrv = inject(TransportApiService);
  cdr = inject(ChangeDetectorRef);
  router = inject(ActivatedRoute);

  vehicleTypes = [
    'Mini Truck',
    'Pickup Van',
    'Tipper',
    '6 Wheeler Truck',
    '10 Wheeler Truck',
    '12 Wheeler Truck',
    'Trailer',
    'Tractor Trolley',
    'Water Tanker',
    'Crane Truck',
  ];

  materialTypeOptions = [
    'Sand',
    'Gravel',
    'Soil',
    'Bricks',
    'Cement',
    'Steel',
    'Construction Materials',
    'Machinery',
    'Agricultural Products',
    'Waste Removal',
    'Any Load',
  ];

  facilityOptions = [
    'Driver Included',
    'Loading Help Available',
    'Unloading Help Available',
    'GPS Tracking',
    'Long Distance Transport',
    'Local Transport',
    'Night Service',
  ];
  categories = [
    { name: 'All', label: 'All', icon: 'apps', count: 12 },
    { name: 'Traly Auto', label: 'Traly Auto', icon: 'groups', count: 18 },
    { name: 'Max Auto', label: 'Max Auto', icon: 'plumbing', count: 7 },
    { name: 'DCM', label: 'DCM', icon: 'electrical_services', count: 9 },
    { name: 'Lorry', label: 'Lorry', icon: 'carpenter', count: 6 },
    { name: '10 Tyre Lorry', label: '10 Tyre Lorry', icon: 'construction', count: 5 },
    { name: '12 Tyre Lorry', label: '12 Tyre Lorry', icon: 'construction', count: 5 },
  ];

  ngOnInit(): void {
    this.router.paramMap.subscribe((params) => {
      const id = params.get('id');

      if (id) {
        this.isEditMode = true;
        this.propertyId = id;
        this.loadProperty(id);
      }
    });
    this.transportForminit();
    this.getCurrentLocation();
  }

  loadProperty(id: string) {
    this.loaderSrv.show();
    this.transportApiSrv
      .get(API_CONSTANTS.transportApiService.getSingleVehicle, { id })
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (res: any) => {
          this.transportForm.patchValue({
            name: res.data.name,
            mobile: res.data.mobile,
            vehicleType: res.data.vehicleType,
            vehicleNumber: res.data.vehicleNumber,
            capacity: res.data.capacity,
            capacityUnit: res.data.capacityUnit,
            materialTypes: res.data.materialTypes || [],
            price: res.data.price,
            pricingType: res.data.pricingType,
            availability: res.data.availability,
            village: res.data.village,
            district: res.data.district,
            state: res.data.state,
            pincode: res.data.pincode,
            facilities: res.data.facilities || [],
            description: res.data.description,
            verified: res.data.verified,
            active: res.data.active,
            images: res.data.images?.[0]?.url || '',
            location: {
              type: res.data.location?.type || 'Point',
              coordinates: res.data.location?.coordinates || [0, 0],
            },
          });
          this.showMap = true;
          this.cdr.detectChanges();
          this.loaderSrv.hide();
        },
        error: () => {
          this.toastSrv.error('Something went wrong', 'Fail');
        },
      });
  }

  transportForminit() {
    this.transportForm = this.fb.group({
      name: [''],
      mobile: [''],
      vehicleType: [''],
      vehicleNumber: [''],
      capacity: [''],
      capacityUnit: ['Tons'],
      materialTypes: [[]],
      price: [''],
      pricingType: ['Per Trip'],
      availability: ['Available Now'],
      village: [''],
      district: [''],
      state: [''],
      pincode: [''],
      location: this.fb.group({
        type: ['Point'],
        coordinates: [[0, 0]], // [lng, lat]
      }),
      facilities: [[]],
      description: [''],
      images: [],
      verified: [false],
      active: [true],
    });
  }

  onVehicleChange(selectedValue: string) {
    this.transportForm.patchValue({
      vehicleType: selectedValue,
    });
  }

  onUnitChange(selectedValue: string) {
    this.transportForm.patchValue({
      capacityUnit: selectedValue,
    });
  }

  onMapsToggle(event: MatCheckboxChange): void {
    if (event.checked) {
      if (this.selectedLocation) {
        this.zoom = 15;
        this.showMap = true;

        return;
      }
    } else {
      this.showMap = false;
    }
  }

  onLocationSelected(location: { lat: number; lng: number }): void {
    this.transportForm.patchValue({
      location: {
        type: 'Point',
        coordinates: [location.lng, location.lat], // [lat, lng]
      },
    });
  }

  openPostvehicle() {
    this.showPostVechileForm = true;
  }

  saveTransport() {
    if (this.transportForm.invalid) {
      this.transportForm.markAllAsTouched();
      return;
    }
    const formData = new FormData();
    // Form Payload
    formData.append('payload', JSON.stringify(this.transportForm.value));
    // Images
    if (this.selectedImageFile) {
      formData.append('images', this.selectedImageFile);
    }

    const payload = { ...this.transportForm.value };
    delete payload.images;
    this.loaderSrv.show();
    if (!this.isEditMode) {
      this.transportApiSrv.post(API_CONSTANTS.transportApiService.save, formData).subscribe({
        next: (res: any) => {
          this.afterSuccessRes('posted')
        },
        error: (err) => {
          this.loaderSrv.hide();
          this.toastSrv.error('Failed to post service');
        },
      });
    } else {
      formData.append('id', this.propertyId);
      this.transportApiSrv
        .put(API_CONSTANTS.transportApiService.updateVehicle, formData)
        .pipe(takeUntil(this.destroy$))
        .subscribe({
          next: (res) => {
            this.afterSuccessRes('updated');
          },
          error: (err) => {
          this.loaderSrv.hide();
          this.toastSrv.error('Failed to update service');
        },
        });
    }
  }

  afterSuccessRes(postType:string) {
    this.loaderSrv.hide();
    this.toastSrv.success(`Transportation service ${postType} successfully`,'Success');
    this.transportForm.reset();
    this.transportForm.patchValue({
      capacityUnit: 'Tons',
      pricingType: 'Per Trip',
      availability: 'Available Now',
      location: {
        type: 'Point',
        coordinates: [0, 0],
      },
    });
    this.selectedImages = [];
    this.closeVechile();
  }

  getNearByVehicles() {
    this.loaderSrv.show();
    this.transportApiSrv
      .get(API_CONSTANTS.transportApiService.getNearByVehicles, this.selectedLocation)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (res: any) => {
          this.vehicles = res.data;
          this.mapCardItems = res.data.map((item: any) => mapToServiceCard(item, 'Vehicles'));
          this.cdr.detectChanges();
          this.loaderSrv.hide();
        },
        error: () => {
          this.toastSrv.error('Something went wrong', 'Fail');
          this.loaderSrv.hide();
        },
      });
  }

  onMaterialChange(item: string, isChecked: boolean) {
    const materials = [...(this.transportForm.get('materialTypes')?.value || [])];
    if (isChecked) {
      this.selectedMaterials.push(item);
    } else {
      this.selectedMaterials = this.selectedMaterials.filter((val) => val !== item);
    }
    this.transportForm.patchValue({
      materialTypes: this.selectedMaterials,
    });
    this.transportForm.patchValue({
      materialTypes: [...new Set(materials)],
    });
  }

  onFacilityChange(item: string, isChecked: boolean) {
    const facilities = [...(this.transportForm.get('facilities')?.value || [])];
    if (isChecked) {
      this.selectedFacilityOptions.push(item);
    } else {
      this.selectedFacilityOptions = this.selectedFacilityOptions.filter((val) => val !== item);
    }
    this.transportForm.patchValue({
      facilities: this.selectedFacilityOptions,
    });
    this.transportForm.patchValue({
      facilities: [...new Set(facilities)],
    });
  }

  getCurrentLocation(): void {
    navigator.geolocation.getCurrentPosition((position) => {
      this.selectedLocation = {
        lat: position.coords.latitude,
        lng: position.coords.longitude,
      };
      this.transportForm.patchValue({
        location: {
          type: 'Point',
          coordinates: [position.coords.longitude, position.coords.latitude], // [lat, lng]
        },
      });
      this.getNearByVehicles();
    });
  }

  setCategory(category: string) {}

  closeVechile() {
    this.showPostVechileForm = false;
  }

  onDragStart(event: any): void {
    event.preventDefault();
    this.isDragging = true;
    this.dragStartY = this.getClientY(event);
    this.dragStartHeight = parseFloat(this.sheetHeight) || 60;
  }

  @HostListener('window:mousemove', ['$event'])
  @HostListener('window:touchmove', ['$event'])
  onDragMove(event: any): void {
    if (!this.isDragging) {
      return;
    }

    const currentY = this.getClientY(event);
    const delta = ((this.dragStartY - currentY) / window.innerHeight) * 100;
    const nextHeight = Math.min(Math.max(this.dragStartHeight + delta, 60), 100);
    this.sheetHeight = `${nextHeight}vh`;
    this.sheetExpanded = nextHeight >= 85;
  }

  @HostListener('window:mouseup')
  @HostListener('window:touchend')
  onDragEnd(): void {
    if (!this.isDragging) {
      return;
    }
    this.isDragging = false;

    const height = parseFloat(this.sheetHeight) || 60;
    if (height >= 85) {
      this.sheetHeight = '100vh';
      this.sheetExpanded = true;
    } else {
      this.sheetHeight = '60vh';
      this.sheetExpanded = false;
    }
  }

  toggleSheet(): void {
    this.sheetExpanded = !this.sheetExpanded;
    this.sheetHeight = this.sheetExpanded ? '100vh' : '60vh';
  }

  private getClientY(event: any): number {
    if (event.touches?.length) {
      return event.touches[0].clientY;
    }
    return event.clientY ?? 0;
  }

  get filteredWorkers() {
    const query = this.searchText.trim().toLowerCase();

    return this.vehicles?.filter((worker: any) => {
      const matchesCategory =
        this.activeCategory === 'All' || worker.category === this.activeCategory;
      const matchesAvailability =
        this.availabilityFilter === 'All' ||
        (this.availabilityFilter === 'Available today' && worker.availableToday) ||
        (this.availabilityFilter === 'Verified' && worker.verified);
      const matchesSearch =
        !query ||
        worker.name.toLowerCase().includes(query) ||
        worker.category.toLowerCase().includes(query) ||
        worker.role.toLowerCase().includes(query) ||
        worker.skills.some((skill: any) => skill.toLowerCase().includes(query));

      return matchesCategory && matchesAvailability && matchesSearch;
    });
  }

  onVechileImageSelected(file: File | null): void {
    this.selectedImageFile = file;
    this.transportForm.patchValue({
      images: file,
    });
  }

  toggleDetails(vechileId: string): void {
    this.expandedVechileId = this.expandedVechileId === vechileId ? null : vechileId;
  }
}
