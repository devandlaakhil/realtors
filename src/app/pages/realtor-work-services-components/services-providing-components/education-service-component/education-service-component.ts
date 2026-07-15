import { CommonModule } from '@angular/common';
import { Component, inject, OnDestroy, OnInit } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { MatIconModule } from '@angular/material/icon';
import { ToastrService } from 'ngx-toastr';
import { Subject, takeUntil } from 'rxjs';
import { EducationApiService } from '../../../../api-services/education-api-service';
import { EDUCATION_CATEGORIES, EDUCATION_SKILLS } from '../../../../constants/education-categories';
import { LoaderServices } from '../../../../shared-services/loader-services';
import { MobileDialpadService } from '../../../../shared-services/mobile-dialpad-service';
import { ImageUploadComponent } from '../../../shared-components/image-upload-component/image-upload-component';
import { MapComponent } from '../../../shared-components/map-component/map-component';
import { getErrorMessage } from '../../../../shared-services/error-message';

@Component({
  selector: 'app-education-service-component',
  imports: [CommonModule, ReactiveFormsModule, MatIconModule, ImageUploadComponent, MapComponent],
  templateUrl: './education-service-component.html',
  styleUrl: './education-service-component.css',
})
export class EducationServiceComponent implements OnInit, OnDestroy {
  private fb = inject(FormBuilder);
  private api = inject(EducationApiService);
  private route = inject(ActivatedRoute);
  router = inject(Router);
  private loader = inject(LoaderServices);
  private toastr = inject(ToastrService);
  private destroy$ = new Subject<void>();
  phoneCall = inject(MobileDialpadService);

  readonly categories = EDUCATION_CATEGORIES;
  readonly skillsByCategory = EDUCATION_SKILLS;
  providers: any[] = [];
  activeCategory = 'All';
  showPostForm = false;
  isEditMode = false;
  serviceId = '';
  expandedId: string | null = null;
  selectedImage: File | null = null;
  existingImageUrl: string | null = null;
  showLocationMap = false;
  selectedLocation: { lat: number | null; lng: number | null } = { lat: null, lng: null };

  form = this.fb.group({
    name: ['', Validators.required],
    businessName: [''],
    mobile: ['', [Validators.required, Validators.pattern(/^[0-9]{10}$/)]],
    category: ['', Validators.required],
    additionalSkills: [<string[]>[], Validators.required],
    teachingMode: ['Home visit', Validators.required],
    studentLevel: ['', Validators.required],
    experience: [0, [Validators.required, Validators.min(0)]],
    startingPrice: [null as number | null, [Validators.required, Validators.min(0)]],
    village: ['', Validators.required],
    district: ['', Validators.required],
    description: [''],
    latitude: [null as number | null],
    longitude: [null as number | null],
    image: [null as any],
  });

  get availableSkills(): string[] {
    return this.skillsByCategory[this.form.value.category || ''] || [];
  }

  get filteredProviders(): any[] {
    return this.activeCategory === 'All'
      ? this.providers
      : this.providers.filter((item) => item.category === this.activeCategory);
  }

  ngOnInit(): void {
    this.serviceId = this.route.snapshot.paramMap.get('id') || '';
    this.isEditMode = !!this.serviceId;
    this.showPostForm = this.isEditMode || this.route.snapshot.queryParamMap.get('post') === '1';
    this.activeCategory = this.route.snapshot.queryParamMap.get('category') || 'All';
    this.form.controls.category.valueChanges.pipe(takeUntil(this.destroy$)).subscribe(() => {
      this.form.controls.additionalSkills.setValue([]);
    });
    if (this.isEditMode) {
      this.loadService();
    } else {
      this.showPostForm ? this.captureLocation() : this.loadProviders();
    }
  }

  private loadService(): void {
    this.loader.show();
    this.api.getSingle(this.serviceId).pipe(takeUntil(this.destroy$)).subscribe({
      next: (response: any) => {
        const item = Array.isArray(response?.data) ? response.data[0] : response?.data ?? response;
        if (item) {
          const lat = item.latitude ?? item.location?.coordinates?.[1] ?? null;
          const lng = item.longitude ?? item.location?.coordinates?.[0] ?? null;
          this.selectedLocation = { lat, lng };
          this.existingImageUrl = this.imageOf(item);
          this.form.patchValue({
            name: item.name || '',
            businessName: item.businessName || '',
            mobile: item.mobile || '',
            category: item.category || '',
            additionalSkills: item.additionalSkills || [],
            teachingMode: item.teachingMode || 'Home visit',
            studentLevel: item.studentLevel || '',
            experience: Number(item.experience || 0),
            startingPrice: item.startingPrice ?? null,
            village: item.village || '',
            district: item.district || '',
            description: item.description || '',
            latitude: lat,
            longitude: lng,
          });
        }
        this.loader.hide();
      },
      error: (error) => {
        this.loader.hide();
        this.toastr.error(getErrorMessage(error, this.isEditMode ? 'Unable to update education service' : 'Unable to post education service'));
      },
    });
  }

  toggleSkill(skill: string, checked: boolean): void {
    const values = [...(this.form.value.additionalSkills || [])];
    this.form.controls.additionalSkills.setValue(
      checked ? [...new Set([...values, skill])] : values.filter((item) => item !== skill),
    );
  }

  onImage(file: File | null): void {
    this.selectedImage = file;
    if (!file) this.existingImageUrl = null;
    this.form.controls.image.setValue(file);
  }

  toggleDetails(id: string): void {
    this.expandedId = this.expandedId === id ? null : id;
  }

  private captureLocation(): void {
    navigator.geolocation?.getCurrentPosition(({ coords }) => {
      this.selectedLocation = { lat: coords.latitude, lng: coords.longitude };
      this.form.patchValue({ latitude: coords.latitude, longitude: coords.longitude });
    }, () => undefined, {
      enableHighAccuracy: true,
      timeout: 15000,
      maximumAge: 60000,
    });
  }

  onLocationSelected(location: { lat: number; lng: number }): void {
    this.selectedLocation = location;
    this.form.patchValue({ latitude: location.lat, longitude: location.lng });
  }

  private ensureLocation(): Promise<boolean> {
    if (this.form.value.latitude != null && this.form.value.longitude != null) {
      return Promise.resolve(true);
    }
    if (!navigator.geolocation) return Promise.resolve(false);

    return new Promise((resolve) => {
      navigator.geolocation.getCurrentPosition(
        ({ coords }) => {
          this.selectedLocation = { lat: coords.latitude, lng: coords.longitude };
          this.form.patchValue({ latitude: coords.latitude, longitude: coords.longitude });
          resolve(true);
        },
        () => resolve(false),
        { enableHighAccuracy: true, timeout: 15000, maximumAge: 60000 },
      );
    });
  }

  loadProviders(): void {
    this.loader.show();
    const params = this.activeCategory === 'All' ? {} : { category: this.activeCategory };
    if (!navigator.geolocation) {
      this.loader.hide();
      this.toastr.warning('Please enable location to see nearby education providers.', 'Location required');
      return;
    }
    navigator.geolocation.getCurrentPosition(({ coords }) => {
      this.fetch({ ...params, lat: coords.latitude, lng: coords.longitude });
    }, () => {
      this.loader.hide();
      this.toastr.warning('Please enable location to see nearby education providers.', 'Location required');
    }, {
      enableHighAccuracy: false,
      timeout: 3000,
      maximumAge: 60000,
    });
  }

  private fetch(params: any): void {
    this.api.getNearby(params).pipe(takeUntil(this.destroy$)).subscribe({
      next: (response: any) => {
        const data = response?.data ?? response ?? [];
        this.providers = Array.isArray(data) ? data : [];
        this.loader.hide();
      },
      error: () => this.loader.hide(),
    });
  }

  async submit(): Promise<void> {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }
    if (!(await this.ensureLocation())) {
      this.toastr.warning(
        'Enable location permission or select your location on the map.',
        'Location required',
      );
      this.showLocationMap = true;
      return;
    }

    const body = new FormData();
    const raw = this.form.getRawValue();
    const payload = {
      name: raw.name,
      businessName: raw.businessName,
      mobile: raw.mobile,
      category: raw.category,
      additionalSkills: raw.additionalSkills,
      teachingMode: raw.teachingMode,
      studentLevel: raw.studentLevel,
      experience: Number(raw.experience),
      startingPrice: Number(raw.startingPrice),
      village: raw.village,
      district: raw.district,
      description: raw.description,
      latitude: Number(raw.latitude),
      longitude: Number(raw.longitude),
    };
    body.append('payload', JSON.stringify(payload));
    if (this.selectedImage) body.append('images', this.selectedImage);
    this.loader.show();
    const request = this.isEditMode ? this.api.update(this.serviceId, body) : this.api.create(body);
    request.pipe(takeUntil(this.destroy$)).subscribe({
      next: () => {
        this.loader.hide();
        this.toastr.success(
          this.isEditMode ? 'Education service updated successfully' : 'Education service posted successfully',
          'Success',
        );
        this.form.reset({
          additionalSkills: [],
          teachingMode: 'Home visit',
          experience: 0,
        });
        this.selectedImage = null;
        this.existingImageUrl = null;
        this.selectedLocation = { lat: null, lng: null };
        this.showLocationMap = false;
        this.showPostForm = false;
        this.router.navigate(['/services/home']);
      },
      error: () => this.loader.hide(),
    });
  }

  imageOf(item: any): string {
    return (
      item.imageUrl ||
      item.images?.[0]?.url ||
      (typeof item.images?.[0] === 'string' ? item.images[0] : null) ||
      item.image?.[0]?.url ||
      (typeof item.image?.[0] === 'string' ? item.image[0] : null) ||
      item.image?.url ||
      (typeof item.image === 'string' ? item.image : null) ||
      '/images/computer-laptop.png'
    );
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }
}
