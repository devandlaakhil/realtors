import { CommonModule } from '@angular/common';
import { Component, inject, OnInit } from '@angular/core';
import {
  FormBuilder,
  FormGroup,
  FormsModule,
  ReactiveFormsModule,
  Validators,
} from '@angular/forms';
import { MatIconModule } from '@angular/material/icon';
import { RouterModule } from '@angular/router';
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
  ],
  templateUrl: './workers-service-component.html',
  styleUrl: './workers-service-component.css',
})
export class WorkersServiceComponent implements OnInit {
  private fb = inject(FormBuilder);
  private toastr = inject(ToastrService);
  phoneCall = inject(MobileDialpadService);

  showPostWorkerForm = false;
  activeCategory = 'All';
  availabilityFilter = 'All';
  searchText = '';
  selectedWorkerId = 1;
  sheetExpanded: boolean = false;
  expandedWorkerId: number | null = null;
  workerType = Object.values(Worker_Type);
  showMap: boolean = false;
  selectedLocation: any = { lat: '', lng: '' };
  zoom: number = 0;
  workerForm!: FormGroup;
  selectedImageFile!: File | null;
  availableSkills: string[] = [];
  selectedSkills: string[] = [];

  ngOnInit(): void {
    this.initForm();
    this.getCurrentLocation();
    this.workerForm.get('category')?.valueChanges.subscribe((category) => {
      this.availableSkills = WORKER_CATEGORIES[category] || [];

      this.selectedSkills = [];

      this.workerForm.patchValue({
        skills: [],
      });
    });
  }

  categories = [
    { name: 'All', label: 'All', icon: 'apps', count: 12 },
    { name: 'Daily Wage', label: 'Daily wage', icon: 'groups', count: 18 },
    { name: 'Plumber', label: 'Plumbers', icon: 'plumbing', count: 7 },
    { name: 'Electrician', label: 'Electricians', icon: 'electrical_services', count: 9 },
    { name: 'Carpenter', label: 'Carpenters', icon: 'carpenter', count: 6 },
    { name: 'Centring', label: 'Centring', icon: 'construction', count: 5 },
    { name: 'Construction', label: 'Construction', icon: 'engineering', count: 14 },
  ];

  availabilityOptions = ['All', 'Available today', 'Verified'];

  workers = [
    {
      id: 1,
      name: 'Ramesh Kumar',
      category: 'Daily Wage',
      role: 'Mason helper and material lifting',
      mobile: '9876543210',
      village: 'Madhapur',
      district: 'Hyderabad',
      price: 850,
      unit: 'day',
      rating: 4.8,
      jobs: 126,
      distance: '1.8 km',
      experience: '7 years',
      teamSize: '1-8 workers',
      availableToday: true,
      verified: true,
      skills: ['Brick work', 'Concrete mixing', 'Loading', 'Site cleaning'],
      initials: 'RK',
      color: '#2563eb',
    },
    {
      id: 2,
      name: 'Shaik Basha',
      category: 'Plumber',
      role: 'Bathroom, bore line and water tank setup',
      mobile: '9123456780',
      village: 'Kukatpally',
      district: 'Hyderabad',
      price: 600,
      unit: 'visit',
      rating: 4.7,
      jobs: 88,
      distance: '3.2 km',
      experience: '9 years',
      teamSize: 'Solo',
      availableToday: true,
      verified: true,
      skills: ['CPVC', 'PVC', 'Tank fitting', 'Leak repair'],
      initials: 'SB',
      color: '#0891b2',
    },
    {
      id: 3,
      name: 'Anil Reddy',
      category: 'Electrician',
      role: 'House wiring and commercial electrical works',
      mobile: '9988776655',
      village: 'Gachibowli',
      district: 'Hyderabad',
      price: 700,
      unit: 'visit',
      rating: 4.9,
      jobs: 142,
      distance: '4.1 km',
      experience: '10 years',
      teamSize: '1-3 workers',
      availableToday: false,
      verified: true,
      skills: ['Wiring', 'DB setup', 'Lighting', 'Motor starter'],
      initials: 'AR',
      color: '#ca8a04',
    },
    {
      id: 4,
      name: 'Naveen Achari',
      category: 'Carpenter',
      role: 'Doors, cupboards, frames and shuttering support',
      mobile: '9012345678',
      village: 'Manikonda',
      district: 'Hyderabad',
      price: 950,
      unit: 'day',
      rating: 4.6,
      jobs: 74,
      distance: '5.7 km',
      experience: '8 years',
      teamSize: '1-2 workers',
      availableToday: true,
      verified: false,
      skills: ['Door frames', 'Cupboards', 'Repair', 'Shuttering'],
      initials: 'NA',
      color: '#7c3aed',
    },
    {
      id: 5,
      name: 'Mallesh Yadav',
      category: 'Centring',
      role: 'Slab centring, columns and beam support team',
      mobile: '9345678901',
      village: 'Bachupally',
      district: 'Hyderabad',
      price: 1200,
      unit: 'day',
      rating: 4.7,
      jobs: 96,
      distance: '6.4 km',
      experience: '12 years',
      teamSize: '4-12 workers',
      availableToday: false,
      verified: true,
      skills: ['Slab centring', 'Columns', 'Beams', 'Scaffolding'],
      initials: 'MY',
      color: '#16a34a',
    },
    {
      id: 6,
      name: 'Prasad Naik',
      category: 'Construction',
      role: 'Mason, concrete and finishing work contractor',
      mobile: '9090909090',
      village: 'Tellapur',
      district: 'Hyderabad',
      price: 1100,
      unit: 'day',
      rating: 4.8,
      jobs: 119,
      distance: '7.3 km',
      experience: '11 years',
      teamSize: '2-10 workers',
      availableToday: true,
      verified: true,
      skills: ['Masonry', 'Plastering', 'Concrete', 'Tiles support'],
      initials: 'PN',
      color: '#dc2626',
    },
  ];

  toggleDetails(workerId: number): void {
    this.expandedWorkerId = this.expandedWorkerId === workerId ? null : workerId;
  }

  onSkillChange(skill: string, checked: boolean): void {
  if (checked) {
    this.selectedSkills.push(skill);
  } else {
    this.selectedSkills =
      this.selectedSkills.filter(
        (s) => s !== skill
      );
  }

  this.workerForm.patchValue({
    skills: this.selectedSkills,
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

  getCurrentLocation(): void {
    navigator.geolocation.getCurrentPosition((position) => {
      this.workerForm.patchValue({
        latitude: position.coords.latitude,
        longitude: position.coords.longitude,
      });
    });
  }

  onLocationSelected(location: { lat: number; lng: number }): void {
    this.workerForm.patchValue({
      latitude: location.lat,
      longitude: location.lng,
    });
  }

  initForm(): void {
    this.workerForm = this.fb.group({
      name: ['', Validators.required],
      category: ['', Validators.required],
      mobile: ['', Validators.required],
      price: ['', Validators.required],
      village: [''],
      district: [''],
      experience: [''],
      teamSize: [''],
      skills: [[]],
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

    return this.workers.filter((worker) => {
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
        worker.skills.some((skill) => skill.toLowerCase().includes(query));

      return matchesCategory && matchesAvailability && matchesSearch;
    });
  }

  get selectedWorker() {
    return (
      this.filteredWorkers.find((worker) => worker.id === this.selectedWorkerId) ??
      this.filteredWorkers[0] ??
      null
    );
  }

  setCategory(category: string) {
    this.activeCategory = category;
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

  saveWorker(): void {
    if (this.workerForm.invalid) {
      this.workerForm.markAllAsTouched();
      return;
    }

    const formData = new FormData();

    Object.keys(this.workerForm.value).forEach((key) => {
      formData.append(key, this.workerForm.value[key]);
    });

    console.log(this.workerForm.value);

    // API Call
    // this.workerService.saveWorker(formData).subscribe(...)

    this.closePostWorker();
  }
}
