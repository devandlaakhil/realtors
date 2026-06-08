import { CommonModule } from '@angular/common';
import { Component, inject } from '@angular/core';
import { FormBuilder, FormsModule, ReactiveFormsModule, Validators } from '@angular/forms';
import { MatIconModule } from '@angular/material/icon';
import { RouterModule } from '@angular/router';
import { ToastrService } from 'ngx-toastr';
import { MapComponent } from '../../../shared-components/map-component/map-component';
import { MobileDialpadService } from '../../../../shared-services/mobile-dialpad-service';

@Component({
  selector: 'app-workers-service-component',
  imports: [
    CommonModule,
    ReactiveFormsModule,
    RouterModule,
    FormsModule,
    MatIconModule,
    MapComponent,
  ],
  templateUrl: './workers-service-component.html',
  styleUrl: './workers-service-component.css',
})
export class WorkersServiceComponent {
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

  workerForm = this.fb.group({
    name: ['', Validators.required],
    category: ['Daily Wage', Validators.required],
    mobile: ['', [Validators.required, Validators.pattern(/^[0-9]{10}$/)]],
    village: ['', Validators.required],
    district: ['', Validators.required],
    price: [null as number | null, Validators.required],
    experience: [''],
    teamSize: ['Solo'],
    role: ['', Validators.required],
    skills: [''],
  });

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

  saveWorker() {
    if (this.workerForm.invalid) {
      this.workerForm.markAllAsTouched();
      this.toastr.error('Please fill all required fields', 'Validation');
      return;
    }

    const value = this.workerForm.getRawValue();
    const name = value.name ?? '';
    const newWorker = {
      id: Date.now(),
      name,
      category: value.category ?? 'Daily Wage',
      role: value.role ?? '',
      mobile: value.mobile ?? '',
      village: value.village ?? '',
      district: value.district ?? '',
      price: value.price ?? 0,
      unit: 'day',
      rating: 4.5,
      jobs: 0,
      distance: 'New',
      experience: value.experience || 'New worker',
      teamSize: value.teamSize || 'Solo',
      availableToday: true,
      verified: false,
      skills: (value.skills || '')
        .split(',')
        .map((skill) => skill.trim())
        .filter(Boolean),
      initials: name
        .split(' ')
        .map((part) => part[0])
        .join('')
        .slice(0, 2)
        .toUpperCase(),
      color: '#0f766e',
    };

    this.workers = [newWorker, ...this.workers];
    this.selectedWorkerId = newWorker.id;
    this.activeCategory = newWorker.category;
    this.workerForm.reset({
      category: 'Daily Wage',
      teamSize: 'Solo',
    });
    this.showPostWorkerForm = false;
    this.toastr.success('Worker posted successfully', 'Success');
  }
}
