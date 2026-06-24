import { CommonModule } from '@angular/common';
import { ChangeDetectorRef, Component, NgZone, inject } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { ToastrService } from 'ngx-toastr';
import { SubscriptionApiService } from '../../../../api-services/subscription-api-service';
import { AdvertisementApiService } from '../../../../api-services/advertisement-api-service';
import { TranslatePipe } from '../../../../pipes/translatepipe-pipe';

declare var Razorpay: any;

type AdvertisementType = 'photo' | 'video' | 'social';

@Component({
  selector: 'app-post-advertisement-component',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule,TranslatePipe],
  templateUrl: './post-advertisement-component.html',
  styleUrl: './post-advertisement-component.css',
})
export class PostAdvertisementComponent {
  private fb = inject(FormBuilder);
  private toastr = inject(ToastrService);
  private subscriptionApiSrv = inject(SubscriptionApiService);
  private advertisementApiSrv = inject(AdvertisementApiService);
  private cdr = inject(ChangeDetectorRef);
  private ngZone = inject(NgZone);

  readonly adPrice = 2;
  selectedFileName = '';
  paymentDone = false;
  isPosting = false;
  private paymentDetails: any = null;
  private coordinates: { lat: number | null; lng: number | null } = {
    lat: null,
    lng: null,
  };

  adForm = this.fb.group({
    title: ['', [Validators.required, Validators.minLength(3)]],
    adType: ['photo' as AdvertisementType, Validators.required],
    targetLink: [''],
    notes: [''],
    media: [null as File | null],
  });

  get selectedType(): AdvertisementType {
    return this.adForm.controls.adType.value || 'photo';
  }

  onTypeChange(type: AdvertisementType): void {
    this.paymentDone = false;
    this.selectedFileName = '';
    this.adForm.patchValue({ adType: type, media: null, targetLink: '' });
  }

  onFileSelected(event: Event): void {
    const input = event.target as HTMLInputElement;
    const file = input.files?.[0] || null;
    this.adForm.patchValue({ media: file });
    this.selectedFileName = file?.name || '';
    this.paymentDone = false;
  }

  payForAdvertisement(): void {
    if (!this.isValidForPayment()) {
      return;
    }

    this.subscriptionApiSrv.createOrder('ADVERTISEMENT_POST').subscribe({
      next: (res: any) => {
        const options = {
          key: 'rzp_live_T4Ir9tXg8h5845',
          amount: res?.order?.amount || this.adPrice * 100,
          currency: res?.order?.currency || 'INR',
          order_id: res?.order?.id,
          name: 'Realtor App',
          description: 'Post Advertisement',
          method: {
            upi: true,
            card: true,
            netbanking: true,
            wallet: true,
            paylater: true,
          },
          config: {
            display: {
              blocks: {
                upi: {
                  name: 'Pay using UPI',
                  instruments: [
                    {
                      method: 'upi',
                      flows: ['intent', 'collect', 'qr'],
                    },
                  ],
                },
              },
              sequence: ['block.upi'],
              preferences: {
                show_default_blocks: true,
              },
            },
          },
          theme: { color: '#2563eb' },
          modal: {
            ondismiss: () => this.toastr.info('Payment cancelled'),
          },
          handler: (paymentResponse: any) => {
            this.ngZone.run(() => {
              this.subscriptionApiSrv.verifyPayment(paymentResponse).subscribe({
                next: () => {
                  this.paymentDone = true;
                  this.paymentDetails = paymentResponse;
                  this.toastr.success('Payment completed. You can post the advertisement now.');
                  this.cdr.detectChanges();
                },
                error: () => this.toastr.error('Payment verification failed'),
              });
            });
          },
        };

        const rzp = new Razorpay(options);
        rzp.open();
      },
      error: () => this.toastr.error('Unable to start payment'),
    });
  }

  submitAdvertisement(): void {
    if (!this.paymentDone) {
      this.toastr.warning('Please pay ₹2 before posting the advertisement');
      return;
    }

    this.isPosting = true;
    this.getCurrentPosition()
      .then((coords) => {
        this.coordinates = coords;
        const formData = this.buildAdvertisementFormData();

        this.advertisementApiSrv.post('client-advertisement', formData).subscribe({
          next: () => {
            this.toastr.success('Advertisement submitted successfully');
            this.adForm.reset({ adType: 'photo' });
            this.selectedFileName = '';
            this.paymentDone = false;
            this.paymentDetails = null;
            this.isPosting = false;
          },
          error: () => {
            this.toastr.error('Unable to save advertisement');
            this.isPosting = false;
          },
        });
      })
      .catch(() => {
        this.toastr.warning('Please allow location access to save advertisement');
        this.isPosting = false;
      });
  }

  private buildAdvertisementFormData(): FormData {
    const formData = new FormData();
    const payload = {
      title: this.adForm.controls.title.value,
      adType: this.selectedType,
      targetLink: this.adForm.controls.targetLink.value,
      notes: this.adForm.controls.notes.value,
      paidAmount: this.adPrice,
      payment: this.paymentDetails,
      location: {
        lat: this.coordinates.lat,
        lng: this.coordinates.lng,
      },
    };

    formData.append('payload', JSON.stringify(payload));

    const media = this.adForm.controls.media.value;
    if (media) {
      formData.append('media', media);
    }

    return formData;
  }

  private getCurrentPosition(): Promise<{ lat: number | null; lng: number | null }> {
    return new Promise((resolve, reject) => {
      if (!navigator.geolocation) {
        reject();
        return;
      }

      navigator.geolocation.getCurrentPosition(
        (position) => {
          resolve({
            lat: position.coords.latitude,
            lng: position.coords.longitude,
          });
        },
        () => reject(),
        { enableHighAccuracy: true, timeout: 10000, maximumAge: 60000 },
      );
    });
  }

  private isValidForPayment(): boolean {
    this.adForm.markAllAsTouched();

    if (this.adForm.invalid) {
      this.toastr.warning('Please fill the required details');
      return false;
    }

    if (this.selectedType === 'photo' && !this.adForm.controls.media.value) {
      this.toastr.warning('Please upload a photo banner');
      return false;
    }

    if (
      this.selectedType === 'video' &&
      !this.adForm.controls.targetLink.value &&
      !this.adForm.controls.media.value
    ) {
      this.toastr.warning('Please upload a video or add the video link');
      return false;
    }

    if (this.selectedType === 'social' && !this.adForm.controls.targetLink.value) {
      this.toastr.warning('Please add the video or social media link');
      return false;
    }

    return true;
  }
}
