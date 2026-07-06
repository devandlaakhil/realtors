import { CommonModule } from '@angular/common';
import { Component, inject, OnDestroy, OnInit } from '@angular/core';
import {
  FormArray,
  FormBuilder,
  ReactiveFormsModule,
  Validators,
} from '@angular/forms';
import { MatIconModule } from '@angular/material/icon';
import { ActivatedRoute, Router } from '@angular/router';
import { Subject, takeUntil } from 'rxjs';
import { ToastrService } from 'ngx-toastr';
import {
  DynamicCategoryApiService,
  DynamicCategoryField,
  DynamicFieldType,
  DynamicServiceCategory,
} from '../../../../api-services/dynamic-category-api-service';
import { LoaderServices } from '../../../../shared-services/loader-services';
import { MapComponent } from '../../../shared-components/map-component/map-component';
import { AuthService } from '../../../../auth-services/auth-services';

@Component({
  selector: 'app-dynamic-service-category-component',
  imports: [CommonModule, ReactiveFormsModule, MatIconModule, MapComponent],
  templateUrl: './dynamic-service-category-component.html',
  styleUrl: './dynamic-service-category-component.css',
})
export class DynamicServiceCategoryComponent implements OnInit, OnDestroy {
  private fb = inject(FormBuilder);
  private api = inject(DynamicCategoryApiService);
  private route = inject(ActivatedRoute);
  router = inject(Router);
  private toastr = inject(ToastrService);
  private loader = inject(LoaderServices);
  private auth = inject(AuthService);
  private destroy$ = new Subject<void>();

  readonly fieldTypes: { value: DynamicFieldType; label: string }[] = [
    { value: 'text', label: 'Text' },
    { value: 'textarea', label: 'Long text' },
    { value: 'number', label: 'Number' },
    { value: 'tel', label: 'Phone' },
    { value: 'email', label: 'Email' },
    { value: 'date', label: 'Date' },
    { value: 'time', label: 'Time' },
    { value: 'select', label: 'Dropdown' },
    { value: 'checkbox', label: 'Checkbox' },
    { value: 'image', label: 'Image upload' },
    { value: 'location', label: 'Map location' },
  ];

  isBuilder = false;
  showPostForm = false;
  category: DynamicServiceCategory | null = null;
  posts: any[] = [];
  publishedCategories: DynamicServiceCategory[] = [];
  files = new Map<string, File[]>();
  showMaps = new Set<string>();

  categoryForm = this.fb.group({
    name: ['', Validators.required],
    slug: ['', [Validators.required, Validators.pattern(/^[a-z0-9-]+$/)]],
    description: [''],
    iconUrl: [''],
    sectionName: ['More Services'],
    fields: this.fb.array([]),
  });

  postForm = this.fb.group({});

  get fieldsArray(): FormArray {
    return this.categoryForm.controls.fields;
  }

  ngOnInit(): void {
    this.isBuilder = this.route.snapshot.routeConfig?.path === 'category-builder';
    if (this.isBuilder) {
      this.addField();
      this.loadPublishedCategories();
      return;
    }

    this.showPostForm = this.route.snapshot.queryParamMap.get('post') === '1';
    const slug = this.route.snapshot.paramMap.get('slug') || '';
    this.loadCategory(slug);
  }

  addField(): void {
    this.fieldsArray.push(this.fb.group({
      key: ['', [Validators.required, Validators.pattern(/^[a-zA-Z][a-zA-Z0-9_]*$/)]],
      label: ['', Validators.required],
      type: ['text' as DynamicFieldType, Validators.required],
      required: [false],
      placeholder: [''],
      optionsText: [''],
      multiple: [false],
      accept: ['image/*'],
    }));
  }

  removeField(index: number): void {
    this.fieldsArray.removeAt(index);
  }

  generateSlug(): void {
    const name = this.categoryForm.value.name || '';
    this.categoryForm.patchValue({
      slug: name.toLowerCase().trim().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, ''),
    });
  }

  publishCategory(): void {
    if (this.categoryForm.invalid || !this.fieldsArray.length) {
      this.categoryForm.markAllAsTouched();
      this.toastr.warning('Add a category name and at least one valid field.', 'Check schema');
      return;
    }

    const raw = this.categoryForm.getRawValue();
    const category: DynamicServiceCategory = {
      name: raw.name!,
      slug: raw.slug!,
      description: raw.description || '',
      iconUrl: raw.iconUrl || '',
      sectionName: raw.sectionName || 'More Services',
      status: 'PUBLISHED',
      fields: raw.fields.map((field: any) => ({
        key: field.key,
        label: field.label,
        type: field.type,
        required: !!field.required,
        placeholder: field.placeholder,
        options: field.type === 'select'
          ? String(field.optionsText || '').split(',').map((option) => option.trim()).filter(Boolean)
          : [],
        multiple: !!field.multiple,
        accept: field.accept || 'image/*',
      })),
    };

    this.loader.show();
    this.api.createCategory(category).pipe(takeUntil(this.destroy$)).subscribe({
      next: () => {
        this.loader.hide();
        this.toastr.success('The category is published and available to users.', 'Published');
        this.categoryForm.reset({ sectionName: 'More Services' });
        this.fieldsArray.clear();
        this.addField();
        this.api.loadPublished().subscribe({ error: () => undefined });
      },
      error: () => this.loader.hide(),
    });
  }

  private loadPublishedCategories(): void {
    this.api.loadPublished().pipe(takeUntil(this.destroy$)).subscribe({
      next: (response: any) => {
        const data = response?.data ?? response?.categories ?? response ?? [];
        this.publishedCategories = Array.isArray(data) ? data : [];
      },
      error: () => undefined,
    });
  }

  deleteCategory(category: DynamicServiceCategory): void {
    if (!confirm(`Delete "${category.name}" and remove it from the application?`)) return;
    this.loader.show();
    this.api.deleteCategory(category.slug).pipe(takeUntil(this.destroy$)).subscribe({
      next: () => {
        this.publishedCategories = this.publishedCategories.filter(
          (item) => item.slug !== category.slug,
        );
        this.loader.hide();
        this.toastr.success('Category deleted successfully.', 'Deleted');
      },
      error: () => this.loader.hide(),
    });
  }

  private loadCategory(slug: string): void {
    this.loader.show();
    this.api.getCategory(slug).pipe(takeUntil(this.destroy$)).subscribe({
      next: (response: any) => {
        this.category = response?.data ?? response?.category ?? response;
        this.buildPostForm(this.category?.fields || []);
        if (this.showPostForm) {
          this.captureDefaultLocation();
          this.loader.hide();
        } else {
          this.loadPosts(slug);
        }
      },
      error: () => this.loader.hide(),
    });
  }

  private buildPostForm(fields: DynamicCategoryField[]): void {
    const controls: Record<string, any> = {};
    fields.forEach((field) => {
      const validators = field.required ? [Validators.required] : [];
      if (field.type === 'email') validators.push(Validators.email);
      controls[field.key] = this.fb.control(
        field.type === 'checkbox' ? false : field.type === 'location' ? null : '',
        validators,
      );
    });
    this.postForm = this.fb.group(controls);
  }

  startPosting(): void {
    if (!this.auth.isLoggedIn()) {
      this.toastr.warning('Please login first to post your details.', 'Login required');
      this.router.navigate(['/login'], {
        queryParams: { returnUrl: `/services/dynamic/${this.category?.slug}?post=1` },
      });
      return;
    }

    this.showPostForm = true;
    this.buildPostForm(this.category?.fields || []);
    this.captureDefaultLocation();
    this.router.navigate([], {
      relativeTo: this.route,
      queryParams: { post: 1 },
      queryParamsHandling: 'merge',
      replaceUrl: true,
    });
  }

  private loadPosts(slug: string): void {
    this.api.getPosts(slug).pipe(takeUntil(this.destroy$)).subscribe({
      next: (response: any) => {
        const data = response?.data ?? response?.posts ?? [];
        this.posts = Array.isArray(data) ? data : [];
        this.loader.hide();
      },
      error: () => this.loader.hide(),
    });
  }

  onFilesSelected(field: DynamicCategoryField, event: Event): void {
    const input = event.target as HTMLInputElement;
    this.files.set(field.key, Array.from(input.files || []));
    this.postForm.get(field.key)?.setValue(input.files?.length ? input.files[0].name : '');
  }

  toggleMap(fieldKey: string, checked: boolean): void {
    checked ? this.showMaps.add(fieldKey) : this.showMaps.delete(fieldKey);
  }

  onLocation(fieldKey: string, location: { lat: number; lng: number }): void {
    this.postForm.get(fieldKey)?.setValue(location);
  }

  private captureDefaultLocation(): void {
    const locationFields = this.category?.fields.filter((field) => field.type === 'location') || [];
    if (!locationFields.length || !navigator.geolocation) return;
    navigator.geolocation.getCurrentPosition(({ coords }) => {
      locationFields.forEach((field) =>
        this.onLocation(field.key, { lat: coords.latitude, lng: coords.longitude }),
      );
    }, () => {
      this.toastr.warning(
        'Please enable location permission or choose the location on the map.',
        'Location required',
      );
    }, {
      enableHighAccuracy: true,
      timeout: 15000,
      maximumAge: 60000,
    });
  }

  submitPost(): void {
    if (!this.category || this.postForm.invalid) {
      this.postForm.markAllAsTouched();
      this.toastr.warning('Please complete the required fields.', 'Check details');
      return;
    }

    const values = this.postForm.getRawValue() as Record<string, any>;
    const body = new FormData();
    body.append('payload', JSON.stringify(values));
    const locationFields = this.category.fields.filter((field) => field.type === 'location');
    locationFields.forEach((field, index) => {
      const location = values[field.key] as { lat?: number; lng?: number } | null;
      if (location?.lat == null || location?.lng == null) return;

      // Keep each dynamic location addressable by its schema key.
      body.append(`${field.key}[lat]`, String(location.lat));
      body.append(`${field.key}[lng]`, String(location.lng));

      // Most backends expect the primary location as top-level coordinates.
      if (index === 0) {
        body.append('lat', String(location.lat));
        body.append('lng', String(location.lng));
        body.append('latitude', String(location.lat));
        body.append('longitude', String(location.lng));
      }
    });
    this.files.forEach((files, key) => files.forEach((file) => body.append(key, file)));
    this.loader.show();
    this.api.createPost(this.category.slug, body).pipe(takeUntil(this.destroy$)).subscribe({
      next: () => {
        this.loader.hide();
        this.toastr.success('Your service was posted successfully.', 'Published');
        this.router.navigate(['/services/dynamic', this.category!.slug]);
      },
      error: () => this.loader.hide(),
    });
  }

  displayValue(post: any, field: DynamicCategoryField): string {
    const value = post?.data?.[field.key] ??
      post?.values?.[field.key] ??
      post?.payload?.[field.key] ??
      post?.[field.key];
    if (value == null || value === '') return '—';
    if (typeof value === 'boolean') return value ? 'Yes' : 'No';
    if (typeof value === 'object') return value.address || `${value.lat}, ${value.lng}`;
    return String(value);
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }
}
