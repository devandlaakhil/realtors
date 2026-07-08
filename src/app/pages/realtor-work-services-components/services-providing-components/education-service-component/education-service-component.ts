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
  expandedId: string | null = null;
  selectedImage: File | null = null;
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
    this.showPostForm = this.route.snapshot.queryParamMap.get('post') === '1';
    this.activeCategory = this.route.snapshot.queryParamMap.get('category') || 'All';
    this.form.controls.category.valueChanges.pipe(takeUntil(this.destroy$)).subscribe(() => {
      this.form.controls.additionalSkills.setValue([]);
    });
    this.showPostForm ? this.captureLocation() : this.loadProviders();
  }

  toggleSkill(skill: string, checked: boolean): void {
    const values = [...(this.form.value.additionalSkills || [])];
    this.form.controls.additionalSkills.setValue(
      checked ? [...new Set([...values, skill])] : values.filter((item) => item !== skill),
    );
  }

  onImage(file: File | null): void {
    this.selectedImage = file;
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
    this.fetch(params);
    navigator.geolocation?.getCurrentPosition(({ coords }) => {
      this.fetch({ ...params, lat: coords.latitude, lng: coords.longitude });
    }, () => undefined, {
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
    this.api.create(body).pipe(takeUntil(this.destroy$)).subscribe({
      next: () => {
        this.loader.hide();
        this.toastr.success('Education service posted successfully', 'Success');
        this.router.navigate(['/services/education']);
      },
      error: () => this.loader.hide(),
    });
  }

  imageOf(item: any): string {
    return item.images?.[0]?.url || item.image?.[0]?.url || item.image?.url || '/images/computer-laptop.png';
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }
}
