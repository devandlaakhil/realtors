import { CommonModule } from '@angular/common';
import { ChangeDetectorRef, Component, HostListener, inject, OnInit } from '@angular/core';
import {
  FormBuilder,
  FormGroup,
  FormsModule,
  ReactiveFormsModule,
  Validators,
} from '@angular/forms';
import { MatIcon, MatIconModule } from '@angular/material/icon';
import { ActivatedRoute, Router, RouterModule } from '@angular/router';
import { ToastrService } from 'ngx-toastr';
import { MapComponent } from '../../../shared-components/map-component/map-component';
import { MobileDialpadService } from '../../../../shared-services/mobile-dialpad-service';
import { MatLabel } from '@angular/material/form-field';
import { MatSelectModule } from '@angular/material/select';
import { MatCard } from '@angular/material/card';
import { MatInput } from '@angular/material/input';
import { MatButton } from '@angular/material/button';
import { Worker_Type } from '../../../../constants/enums/worker-posting-enums';
import { TranslatePipe } from '../../../../pipes/translatepipe-pipe';
import { MatCheckbox, MatCheckboxChange } from '@angular/material/checkbox';
import { ImageUploadComponent } from '../../../shared-components/image-upload-component/image-upload-component';
import { WORKER_CATEGORIES } from '../../../../constants/workers-category-skills';
import { WorkerApiServices } from '../../../../api-services/worker-api-services';
import { API_CONSTANTS } from '../../../../constants/realtors-services-api-constants';
import { Subject, takeUntil } from 'rxjs';
import { LoaderServices } from '../../../../shared-services/loader-services';
import { mapToServiceCard,mapCardItems } from '../supporting-files/mapCardMapper';
import { getErrorMessage } from '../../../../shared-services/error-message';
@Component({
  selector: 'app-workers-service-component',
  imports: [
    CommonModule,
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
  templateUrl: './workers-service-component.html',
  styleUrl: './workers-service-component.css',
})
export class WorkersServiceComponent implements OnInit {
  private fb = inject(FormBuilder);
  private toastr = inject(ToastrService);
  phoneCall = inject(MobileDialpadService);
  workerApiSrv = inject(WorkerApiServices);
  destroy$ = new Subject<any>();
  route = inject(Router);
  router = inject(ActivatedRoute);
  loaderService = inject(LoaderServices);
  cdr = inject(ChangeDetectorRef);
  mapCardItems = mapCardItems;
  

  showPostWorkerForm = false;
  activeCategory = 'All';
  availabilityFilter = 'All';
  searchText = '';
  selectedWorkerId = 1;
  sheetExpanded = false;
  sheetHeight = '60vh';
  expandedWorkerId: string | null = null;
  workerType = Object.values(Worker_Type);
  readonly cleaningCategories = WORKER_CATEGORIES['Cleaner'];
  showMap: boolean = false;
  selectedLocation: any = { lat: '', lng: '' };
  zoom: number = 0;
  workerForm!: FormGroup;
  selectedImageFile!: File | null;
  availableSkills: string[] = [];
  selectedSkills: string[] = [];
  workers: any[] = [];
  private isDragging = false;
  private dragStartY = 0;
  private dragStartHeight = 60;
  isEditMode: boolean = false;
  propertyId: string = '';

  categories = [
    { name: 'All', label: 'All', icon: 'apps', count: 12 },
    { name: 'Daily Wage', label: 'Daily wage', icon: 'groups', count: 18 },
    { name: 'Plumber', label: 'Plumbers', icon: 'plumbing', count: 7 },
    { name: 'Electrician', label: 'Electricians', icon: 'electrical_services', count: 9 },
    { name: 'Carpenter', label: 'Carpenters', icon: 'carpenter', count: 6 },
    { name: 'Centring', label: 'Centring', icon: 'construction', count: 5 },
    { name: 'Painter', label: 'Painter', icon: 'construction', count: 5 },
    { name: 'Construction', label: 'Construction', icon: 'engineering', count: 14 },
    { name: 'Cleaner', label: 'Cleaners', icon: 'cleaning_services', count: 0 },
  ];
  availabilityOptions = ['All', 'Available today', 'Verified'];


  ngOnInit(): void {
    const requestedCategory = this.router.snapshot.queryParamMap.get('category');
    const normalizedCategory = this.normalizeWorkerCategory(requestedCategory);
    if (normalizedCategory && this.categories.some((category) => category.name === normalizedCategory)) {
      this.activeCategory = normalizedCategory;
    }

    this.router.paramMap.subscribe((params) => {
      const id = params.get('id');

      if (id) {
        this.isEditMode = true;
        this.propertyId = id;
        this.loadProperty(id);
      }
    });
    this.initForm();
    this.showPostWorkerForm = this.router.snapshot.queryParamMap.get('post') === '1';
    if (!this.showPostWorkerForm && !this.isEditMode) {
      this.loaderService.show();
      this.getCurrentLocation();
    }
    this.workerForm.get('category')?.valueChanges.subscribe((category) => {
      this.availableSkills = WORKER_CATEGORIES[category] || [];
      const cleaningCategory = this.workerForm.get('cleaningCategory');
      if (category === Worker_Type.CLEANER) {
        cleaningCategory?.setValidators(Validators.required);
      } else {
        cleaningCategory?.clearValidators();
        cleaningCategory?.setValue('');
      }
      cleaningCategory?.updateValueAndValidity({ emitEvent: false });

      this.selectedSkills = [];

      this.workerForm.patchValue({
        skills: [],
      });
    });
  }

  loadProperty(id: string) {
    this.isEditMode = true;
    this.loaderService.show();
    this.workerApiSrv
      .get(API_CONSTANTS.workerapiServices.getSingleItem, { id })
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (res: any) => {
          const worker = res.data;
          this.workerForm.patchValue({
            name: res.data.name,
            category: res.data.category,
            mobile: res.data.mobile,
            price: res.data.price,
            village: res.data.village,
            district: res.data.district,
            experience: res.data.experience,
            isActive: res.data.isActive,
            teamSize: res.data.teamSize,
            skills: res.data.skills || [],
            cleaningCategory: res.data.cleaningCategory || res.data.cleaningType || '',
            role: res.data.role,

            // Image
            image: res.data.image?.length ? res.data.image[0].url : null,

            // Coordinates
            latitude: res.data.location?.coordinates?.[1] || null,
            longitude: res.data.location?.coordinates?.[0] || null,
          });
          this.zoom = 15;
          this.showMap = true;
          this.cdr.detectChanges();
          this.loaderService.hide();
        },
        error: () => {
          this.loaderService.hide();
        },
      });
  }

  isSkillSelected(skill: string): boolean {
    return this.workerForm.get('skills')?.value?.includes(skill);
  }
  toggleDetails(workerId: string): void {
    this.expandedWorkerId = this.expandedWorkerId === workerId ? null : workerId;
  }

  toggleSheet(): void {
    this.sheetExpanded = !this.sheetExpanded;
    this.sheetHeight = this.sheetExpanded ? '100%' : '60vh';
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
      this.sheetHeight = '100%';
      this.sheetExpanded = true;
    } else {
      this.sheetHeight = '60vh';
      this.sheetExpanded = false;
    }
  }

  private getClientY(event: any): number {
    if (event.touches?.length) {
      return event.touches[0].clientY;
    }
    return event.clientY ?? 0;
  }

  onSkillChange(skill: string, checked: boolean): void {
    const skills = [...(this.workerForm.get('skills')?.value || [])];

    if (checked) {
      if (!skills.includes(skill)) {
        skills.push(skill);
      }
    } else {
      const index = skills.indexOf(skill);
      if (index > -1) {
        skills.splice(index, 1);
      }
    }

    this.workerForm.patchValue({
      skills,
    });
  }

  async onMapsToggle(event: MatCheckboxChange): Promise<void> {
    if (event.checked) {
      if (!this.hasValidLocation()) {
        await this.ensureLocation();
      }
      this.zoom = 15;
      this.showMap = true;
    } else {
      this.showMap = false;
    }
  }

  getCurrentLocation(): void {
    if (!navigator.geolocation) {
      this.loaderService.hide();
      this.toastr.warning('Please enable location to see nearby workers.', 'Location required');
      return;
    }

    navigator.geolocation.getCurrentPosition(
      (position) => {
        this.selectedLocation = {
          lat: position.coords.latitude,
          lng: position.coords.longitude,
        };
        this.workerForm.patchValue({
          latitude: position.coords.latitude,
          longitude: position.coords.longitude,
        });
        this.getAllWorkers();
      },
      () => {
        this.loaderService.hide();
        this.toastr.warning('Please enable location to see nearby workers.', 'Location required');
      },
      {
        enableHighAccuracy: false,
        timeout: 3000,
        maximumAge: 60000,
      },
    );
  }

  onLocationSelected(location: { lat: number; lng: number }): void {
    this.selectedLocation = location;
    this.workerForm.patchValue({
      latitude: location.lat,
      longitude: location.lng,
    });
  }

  initForm(): void {
    this.workerForm = this.fb.group({
      name: ['', Validators.required],
      category: ['', Validators.required],
      mobile: ['', [Validators.required, Validators.pattern(/^[0-9]{10}$/)]],
      price: ['', Validators.required],
      village: [''],
      district: [''],
      experience: [0],
      isActive: [true],
      teamSize: [0],
      skills: [[]],
      cleaningCategory: [''],
      role: [''],

      // image
      image: [null],

      // coordinates
      latitude: [null],
      longitude: [null],
    });
  }

  get filteredWorkers() {
    const query = this.searchText.trim().toLowerCase();
    const activeCategory = this.normalizeWorkerCategory(this.activeCategory);

    return this.workers?.filter((worker: any) => {
      const matchesCategory =
        activeCategory === 'All' ||
        this.normalizeWorkerCategory(worker.category) === activeCategory;
      const matchesAvailability =
        this.availabilityFilter === 'All' ||
        (this.availabilityFilter === 'Available today' && worker.availableToday) ||
        (this.availabilityFilter === 'Verified' && worker.verified);
      const matchesSearch =
        !query ||
        String(worker.name || '').toLowerCase().includes(query) ||
        String(worker.category || '').toLowerCase().includes(query) ||
        String(worker.role || '').toLowerCase().includes(query) ||
        (worker.skills || []).some((skill: any) => String(skill || '').toLowerCase().includes(query));

      return matchesCategory && matchesAvailability && matchesSearch;
    });
  }

  get selectedWorker() {
    return (
      this.filteredWorkers.find((worker: any) => worker.id === this.selectedWorkerId) ??
      this.filteredWorkers[0] ??
      null
    );
  }

  get mapCenter(): { lat: number; lng: number } | undefined {
    const lat = Number(this.workerForm.get('latitude')?.value);
    const lng = Number(this.workerForm.get('longitude')?.value);
    return Number.isFinite(lat) && Number.isFinite(lng) ? { lat, lng } : undefined;
  }

  setCategory(category: string) {
    this.activeCategory = this.normalizeWorkerCategory(category);
    this.selectedWorkerId = this.filteredWorkers[0]?.id ?? this.selectedWorkerId;
  }

  setAvailability(option: string) {
    this.availabilityFilter = option;
    this.selectedWorkerId = this.filteredWorkers[0]?.id ?? this.selectedWorkerId;
  }

  selectWorker(id: number) {
    this.selectedWorkerId = id;
  }

  openPostWorker() {
    this.showPostWorkerForm = true;
  }

  closePostWorker() {
    this.showPostWorkerForm = false;
  }

  onWorkerImageSelected(file: File | null): void {
    this.selectedImageFile = file;
    this.workerForm.patchValue({
      image: file,
    });
  }

  async saveWorker(): Promise<void> {
    if (this.workerForm.invalid) {
      this.workerForm.markAllAsTouched();
      return;
    }
    if (!(await this.ensureLocation())) {
      this.toastr.warning('Please select your service location on the map.', 'Location required');
      this.showMap = true;
      return;
    }
    const formData = new FormData();
    if (!this.isEditMode) {
      this.loaderService.show();
      formData.append('payload', JSON.stringify(this.workerForm.value));
      if (this.selectedImageFile) {
        formData.append('images', this.selectedImageFile);
      }
      this.workerApiSrv
        .post(API_CONSTANTS.workerapiServices.save, formData)
        .pipe(takeUntil(this.destroy$))
        .subscribe({
          next: (res) => {
            this.workerForm.reset();
            this.selectedImageFile = null;
            this.selectedSkills = [];
            this.availableSkills = [];
            this.selectedLocation = { lat: '', lng: '' };
            this.showMap = false;
            this.loaderService.hide();
            this.route.navigate(['/services/home']);
            this.toastr.success('Successfully posted your service', 'Success');
          },
          error: (error) => {
            this.loaderService.hide();
            this.toastr.error(getErrorMessage(error, 'Failed to post worker service'));
          },
        });
    }else{
      this.loaderService.show();
      formData.append('id', this.propertyId);
      formData.append('payload', JSON.stringify(this.workerForm.value));
      if (this.selectedImageFile) {
        formData.append('images', this.selectedImageFile);
      }
      this.workerApiSrv
        .put(API_CONSTANTS.workerapiServices.update, formData)
        .pipe(takeUntil(this.destroy$))
        .subscribe({
          next: (res) => {
            this.workerForm.reset();
            this.selectedImageFile = null;
            this.selectedSkills = [];
            this.availableSkills = [];
            this.selectedLocation = { lat: '', lng: '' };
            this.showMap = false;
            this.loaderService.hide();
            this.route.navigate(['/services/home']);
            this.toastr.success('Successfully updated your service', 'Success');
          },
          error: (error) => {
            this.loaderService.hide();
            this.toastr.error(getErrorMessage(error, 'Failed to update worker service'));
          },
        });
    }

    this.closePostWorker();
  }

  getAllWorkers() {
    const locationParams =
      this.selectedLocation.lat !== '' && this.selectedLocation.lng !== ''
        ? this.selectedLocation
        : undefined;

    this.workerApiSrv
      .get(API_CONSTANTS.workerapiServices.getAll, locationParams)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (res: any) => {
          this.workers = res.data;
           this.mapCardItems =this.workers.map((item: any) => mapToServiceCard(item, 'workers'));
          this.cdr.detectChanges();
          this.loaderService.hide();
        },
        error: () => {
          this.loaderService.hide();
        },
      });
  }

  private ensureLocation(): Promise<boolean> {
    const lat = Number(this.workerForm.get('latitude')?.value);
    const lng = Number(this.workerForm.get('longitude')?.value);
    if (Number.isFinite(lat) && Number.isFinite(lng)) {
      this.onLocationSelected({ lat, lng });
      return Promise.resolve(true);
    }

    if (!navigator.geolocation) {
      return Promise.resolve(false);
    }

    return new Promise((resolve) => {
      navigator.geolocation.getCurrentPosition(
        ({ coords }) => {
          this.onLocationSelected({ lat: coords.latitude, lng: coords.longitude });
          resolve(true);
        },
        () => resolve(false),
        { enableHighAccuracy: true, timeout: 10000, maximumAge: 60000 },
      );
    });
  }

  private hasValidLocation(): boolean {
    const lat = Number(this.workerForm.get('latitude')?.value);
    const lng = Number(this.workerForm.get('longitude')?.value);
    return Number.isFinite(lat) && Number.isFinite(lng);
  }

  private normalizeWorkerCategory(category: unknown): string {
    const value = String(category || 'All').trim().toLowerCase();
    const aliases: Record<string, string> = {
      all: 'All',
      worker: 'All',
      workers: 'All',
      'daily wage': 'Daily Wage',
      dailywage: 'Daily Wage',
      plumber: 'Plumber',
      plumbers: 'Plumber',
      electrician: 'Electrician',
      electricians: 'Electrician',
      carpenter: 'Carpenter',
      carpenters: 'Carpenter',
      centring: 'Centring',
      painter: 'Painter',
      painters: 'Painter',
      construction: 'Construction',
      mestri: 'Construction',
      'worker(mestri)': 'Construction',
      flooring: 'Flooring',
      cleaner: 'Cleaner',
      cleaners: 'Cleaner',
    };

    return aliases[value] || String(category || 'All').trim();
  }


}
