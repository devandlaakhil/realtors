import { CommonModule } from '@angular/common';
import { Component, inject, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { ActivatedRoute, Router } from '@angular/router';
import { ToastrService } from 'ngx-toastr';
import { Subject, takeUntil } from 'rxjs';
import { RealEstateApiService } from '../../../api-services/realestate-api-services';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatCheckboxChange } from '@angular/material/checkbox';
import { CommonServices } from '../../../shared-services/common-services';
import { take } from 'rxjs/operators';

enum Property_Type {
  VILLA = 'Villa',
  HOUSE = 'House',
  APARTMENT = 'Apartment',
  PLOT = 'Plot/Land',
  SHOPE = 'Shop',
}

enum Location {
  HYDERABAD = 'Hyderabad',
  GUNTUR = 'Guntur',
  ONGOLE = 'Ongole',
  VIJAYAWADA = 'Vijayawada',
  TIRUPATI = 'Tirupati',
  VIZAG = 'Vizag',
}

enum status {
  SALE = 'Sale',
  LEASE = 'Lease',
  RENT = 'Rent',
}

@Component({
  selector: 'app-ad-posting-services-component',
  imports: [
    CommonModule,
    MatFormFieldModule,
    MatInputModule,
    MatSelectModule,
    MatButtonModule,
    MatIconModule,
    ReactiveFormsModule,
    MatCheckboxModule,
    MatTooltipModule,
  ],
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
  realestateApiSrv = inject(RealEstateApiService);
  destroy$ = new Subject<any>();
  toastr = inject(ToastrService);
  router = inject(Router);
  selectedVideo!: File;
  videoPreview: string | null = null;
  route = inject(ActivatedRoute);
  isEditMode = false;
  propertyId = '';
  existingImages: any[] = [];
  existingVideos: any[] = [];
  isPlotOrLand: boolean = false;
  commonSrv = inject(CommonServices);
  showOfferField:boolean= false;

  ngOnInit(): void {
    this.initForm();
    this.route.paramMap.subscribe((params) => {
      const id = params.get('id');

      if (id) {
        this.isEditMode = true;
        this.propertyId = id;
        this.loadProperty(id);
      }
    });
    this.propertyForm.get('propertyType')?.valueChanges.subscribe((type) => {
      this.handlePropertyType(type);
    });
  }

  handlePropertyType(type: string) {
    const details = this.propertyForm.get('details') as FormGroup;

    if (type === 'Plot/Land') {
      this.isPlotOrLand = true;
      details.get('bedrooms')?.disable();
      details.get('bathrooms')?.disable();
      details.get('floor')?.disable();
      details.get('totalFloors')?.disable();
      details.get('furnishing')?.disable();
    } else {
      this.isPlotOrLand = false;
      details.get('bedrooms')?.enable();
      details.get('bathrooms')?.enable();
      details.get('floor')?.enable();
      details.get('totalFloors')?.enable();
      details.get('furnishing')?.enable();
    }
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
      isOffer:[false],
      offerdetails: [''],
      videoUrl: [''],

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

  loadProperty(id: string) {
    this.realestateApiSrv.getProduct(id).subscribe({
      next: (res: any) => {
        const property = res.data;
        this.showOfferField = res.data.isOffer == true ? true : false; 
        this.propertyForm.patchValue({
          title: property.title,
          description: property.description,
          propertyType: property.propertyType,
          status: property.status,

          location: property.location,

          price: property.price,
          priceType: property.priceType,
          negotiable: property.negotiable,
          isOffer : property.isOffer,
          offerdetails : property.offerdetails,
          details: property.details,

          contact: property.contact,

          videoUrl: property.videoLink || '',
        });

        // Existing images
        this.existingImages = property.images || [];

        property.images?.forEach((img: any) => {
          this.imagePreview[img.type] = img.url;
        });

        // Existing videos
        this.existingVideos = property.videos || [];

        if (property.videos?.length) {
          this.videoPreview = property.videos[0].url;
        }
      },
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
    if (this.imagePreview[type] && this.imagePreview[type].startsWith('blob:')) {
      URL.revokeObjectURL(this.imagePreview[type]);
    }
    this.images[type] = null;
    this.imagePreview[type] = '';
    this.existingImages = this.existingImages.filter((img: any) => img.type !== type);
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

  onVideoSelect(event: any) {
    const file = event.target.files[0];
    if (!file) return;
    this.selectedVideo = file;
    this.videoPreview = URL.createObjectURL(file);
  }

  removeVideo() {
    this.selectedVideo = null as any;
    this.videoPreview = null;

    this.existingVideos = [];
  }

  submit() {
    if (this.propertyForm.invalid) {
      this.propertyForm.markAllAsTouched();

      this.toastr.error('Please fill all required fields', 'Validation');

      return;
    }
    const formData = new FormData();
    const formValue = this.propertyForm.value;
    // NORMAL FIELDS
    formData.append('title', formValue.title);
    formData.append('description', formValue.description);
    formData.append('propertyType', formValue.propertyType);
    formData.append('status', formValue.status);
    formData.append('price', formValue.price);
    formData.append('priceType', formValue.priceType);
    formData.append('negotiable', String(formValue.negotiable));
    formData.append('isOffer', String(formValue.isOffer));
    formData.append('offerdetails', formValue.offerdetails);

    // VIDEO URL
    formData.append('videoUrl', formValue.videoUrl || '');

    // NESTED OBJECTS
    formData.append('location', JSON.stringify(formValue.location));

    formData.append('details', JSON.stringify(formValue.details));

    formData.append('contact', JSON.stringify(formValue.contact));

    // EXISTING IMAGES
    formData.append('existingImages', JSON.stringify(this.existingImages));

    // EXISTING VIDEOS
    formData.append('existingVideos', JSON.stringify(this.existingVideos));

    // NEW IMAGES
    Object.keys(this.images).forEach((type) => {
      if (this.images[type]) {
        formData.append('images', this.images[type]);

        formData.append('imageTypes', type);
      }
    });

    // NEW VIDEO
    if (this.selectedVideo) {
      formData.append('propertyVideo', this.selectedVideo);
    }

    // EDIT MODE
    if (this.isEditMode) {
      this.realestateApiSrv
        .updatePosting(this.propertyId, formData)
        .pipe(takeUntil(this.destroy$))
        .subscribe({
          next: () => {
            this.toastr.success('Property updated successfully', 'Success');

            this.router.navigate(['/dashboard']);
          },
          error: () => {
            this.toastr.error('Something went wrong', 'Fail');
          },
        });

      return;
    }

    // CREATE MODE
    this.realestateApiSrv
      .savePosting(formData)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: () => {
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

  getError(controlName: string): string {
    const control = this.propertyForm.get(controlName);

    if (!control || !control.touched) {
      return '';
    }

    if (control.hasError('required')) {
      return 'This field is required';
    }

    if (control.hasError('email')) {
      return 'Enter a valid email address';
    }

    return '';
  }

  onGpsToggle(event: MatCheckboxChange) {
    const details = this.propertyForm.get('location') as FormGroup;
    if (event.checked) {
      this.commonSrv.address$.pipe(take(1)).subscribe((data) => {
        details.get('address')?.patchValue(data);
      });
    }else{
      details.get('address')?.reset();
    }
  }

  onOffer(event: MatCheckboxChange){
    if(event.checked){
      this.showOfferField = true;
    }else{
      if(!this.isEditMode){
        this.propertyForm.get('offerdetails')?.reset();
      }
      this.showOfferField = false;
    }
  }
}
