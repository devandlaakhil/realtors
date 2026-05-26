import { CommonModule } from '@angular/common';
import { Component, inject, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { Router } from '@angular/router';
import { ToastrService } from 'ngx-toastr';
import { Subject, takeUntil } from 'rxjs';
import { RealEstateApiServices } from '../../../api-services/real-estate-api-services';

enum Property_Type {
  VILLA = 'Villa',
  HOUSE = 'House',
  APARTMENT = 'Apartment',
  PLOT = 'Plot',
  SHOPE = 'Shop'
}

enum Location {
  HYDERABAD = 'hyderabad',
  GUNTUR = 'guntur',
  ONGOLE = 'ongole',
  VIJAYAWADA = 'vijayawada',
  TIRUPATI = 'tirupati',
  VIZAG = 'vizag',
}

enum status {
  SALE = 'Sale',
  LEASE = 'Lease',
  RENT = 'Rent',
}

@Component({
  selector: 'app-ad-posting-services-component',
  imports: [CommonModule,
    MatFormFieldModule,
    MatInputModule,
    MatSelectModule,
    MatButtonModule,
    MatIconModule,
    ReactiveFormsModule,
    MatCheckboxModule,],
  templateUrl: './ad-posting-services-component.html',
  styleUrl: './ad-posting-services-component.css',
})
export class AdPostingServicesComponent implements OnInit {
  imageTypes = ['main', 'bedroom', 'kitchen', 'bathroom', 'other'];
  images: any = {
    main: null,
    bedroom: null,
    kitchen: null,
    bathroom: null,
    other: null,
  };

  imagePreview: any = {
    main: '',
    bedroom: '',
    kitchen: '',
    bathroom: '',
    other: '',
  };

  propertyForm!: FormGroup;
  fb = inject(FormBuilder);
  propertyTypes = Object.values(Property_Type);
  cities = Object.values(Location);
  propertyStatus = Object.values(status);
  realestateApiSrv = inject(RealEstateApiServices);
  destroy$ = new Subject<any>();
  toastr = inject(ToastrService);
  router = inject(Router);

  ngOnInit(): void {
    this.initForm();
  }

  initForm() {
    this.propertyForm = this.fb.group({
      title: ['', Validators.required],
      description: ['', Validators.required],
      propertyType: ['', Validators.required],
      status: ['', Validators.required],

      location: this.fb.group({
        city: ['', Validators.required],
        area: ['', Validators.required],
        address: [''],
        pincode: [''],
      }),

      price: ['', Validators.required],
      priceType: ['total'],
      negotiable: [false],

      details: this.fb.group({
        bedrooms: ['', Validators.required],
        bathrooms: ['', Validators.required],
        area: ['', Validators.required],
        furnishing: [''],
        floor: [''],
        totalFloors: [''],
      }),

      contact: this.fb.group({
        name: ['', Validators.required],
        phone: ['', Validators.required],
        email: ['', Validators.email],
      }),

      images: [[]],
    });
  }

  onImageSelect(event: any, type: string) {
    const file = event.target.files[0];
    if (!file) return;

    if (file.size > 2 * 1024 * 1024) {
      alert('Image must be less than 2MB');
      return;
    }

    // count images
    const totalImages = Object.values(this.images).filter((img) => img !== null).length;

    if (!this.images[type] && totalImages >= 5) {
      alert('Maximum 5 images allowed');
      return;
    }

    this.images[type] = file;

    // ⚡ INSTANT PREVIEW (NO LAG)
    this.imagePreview[type] = URL.createObjectURL(file);
  }

  /* REMOVE IMAGE */
  removeImage(type: string) {
    if (this.imagePreview[type]) {
      URL.revokeObjectURL(this.imagePreview[type]); // cleanup
    }

    this.images[type] = null;
    this.imagePreview[type] = '';
  }

  /* IMAGE UPLOAD */
  onFileChange(event: any) {
    const files = event.target.files;

    if (files.length > 0) {
      const imageArray: File[] = [];

      for (let file of files) {
        imageArray.push(file);

        const reader = new FileReader();
        reader.onload = (e: any) => {
          this.imagePreview.push(e.target.result);
        };
        reader.readAsDataURL(file);
      }

      this.propertyForm.patchValue({
        images: imageArray,
      });
    }
  }

  submit() {
    const formData = new FormData();
    const formValue = this.propertyForm.value;
    // NORMAL FIELDS
    formData.append('title', formValue.title);
    formData.append('description', formValue.description);
    formData.append('propertyType', formValue.propertyType);
    formData.append('status', formValue.status);
    formData.append('price', formValue.price);
    formData.append('priceType', formValue.priceType);
    formData.append('negotiable', formValue.negotiable);
    // NESTED OBJECTS
    formData.append('location', JSON.stringify(formValue.location));
    formData.append('details', JSON.stringify(formValue.details));
    formData.append('contact', JSON.stringify(formValue.contact));
    // IMAGES
    Object.keys(this.images).forEach((type) => {
      if (this.images[type]) {
        formData.append('images', this.images[type]);
        formData.append('imageTypes', type);
      }
    });
    // API
    this.realestateApiSrv
      .savePosting(formData)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (res) => {
          this.propertyForm.reset();
          this.toastr.success('Property posted successfully', 'Success');
          this.router.navigate(['/']);
        },
        error: (err) => {
          console.log(err);
          this.toastr.error('Something went wrong', 'Fail');
        },
      });
  }
}
