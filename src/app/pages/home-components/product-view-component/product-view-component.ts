import { ChangeDetectorRef, Component, inject } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { ToastrService } from 'ngx-toastr';
import { Subject, takeUntil } from 'rxjs';
import { CommonModule, DecimalPipe } from '@angular/common';
import { RealEstateApiService } from '../../../api-services/realestate-api-services';
import { DomSanitizer, SafeResourceUrl } from '@angular/platform-browser';
import { TranslatePipe } from '../../../pipes/translatepipe-pipe';

@Component({
  selector: 'app-product-view-component',
  imports: [CommonModule, DecimalPipe, TranslatePipe],
  templateUrl: './product-view-component.html',
  styleUrl: './product-view-component.css',
})
export class ProductViewComponent {
  private route = inject(ActivatedRoute);
  property: any;
  selectedImage: string = '';
  router = inject(ActivatedRoute);
  productid: string = '';
  realEstateApiSrv = inject(RealEstateApiService);
  destroy$ = new Subject<any>();
  toastr = inject(ToastrService);
  cdr = inject(ChangeDetectorRef);
  sanitizer = inject(DomSanitizer);
  safeVideoUrl: SafeResourceUrl | null = null;

  ngOnInit(): void {
    this.router.paramMap.subscribe((params) => {
      this.productid = params.get('id') || '';

      this.realEstateApiSrv
        .getProduct(this.productid)
        .pipe(takeUntil(this.destroy$))
        .subscribe({
          next: (res) => {
            this.property = res.data;

            // SET DEFAULT IMAGE
            if (this.property?.images?.length > 0) {
              this.selectedImage = this.getImage(this.property.images[0].url);
            }
            this.loadVideo();
            this.cdr.detectChanges();
          },

          error: () => {
          },
        });
    });
  }

  loadVideo() {
    if (this.property?.videoLink) {
      const embedUrl = this.convertToEmbedUrl(this.property.videoLink);

      this.safeVideoUrl = this.sanitizer.bypassSecurityTrustResourceUrl(embedUrl);
    }
  }

  convertToEmbedUrl(url: string): string {
    // Normal YouTube
    if (url.includes('youtube.com/watch?v=')) {
      const videoId = url.split('v=')[1]?.split('&')[0];

      return `https://www.youtube.com/embed/${videoId}`;
    }

    // youtu.be
    if (url.includes('youtu.be/')) {
      const videoId = url.split('youtu.be/')[1]?.split('?')[0];

      return `https://www.youtube.com/embed/${videoId}`;
    }

    // YouTube Shorts
    if (url.includes('youtube.com/shorts/')) {
      const videoId = url.split('shorts/')[1]?.split('?')[0];

      return `https://www.youtube.com/embed/${videoId}`;
    }

    // Instagram Reel
    if (url.includes('instagram.com/reel/')) {
      return `${url.replace(/\/$/, '')}/embed`;
    }

    // Facebook
    if (url.includes('facebook.com')) {
      return `https://www.facebook.com/plugins/video.php?href=${encodeURIComponent(url)}`;
    }

    return url;
  }

  changeImage(img: string) {
    this.selectedImage = this.getImage(img);
  }

  getImage(image: string): string {
    return image;
  }

  openWhatsApp(phoneNumber: string) {
    if (!phoneNumber) return;

    // 1. Strip all non-numeric characters (spaces, dashes, +, brackets)
    let cleanNumber = phoneNumber.replace(/[^0-9]/g, '');

    // 2. Remove leading zero '0' if it exists (common Indian typing habit)
    if (cleanNumber.startsWith('0')) {
      cleanNumber = cleanNumber.substring(1);
    }

    // 3. Remove international double zero '0091' prefix if present
    if (cleanNumber.startsWith('0091')) {
      cleanNumber = cleanNumber.substring(4);
    }

    // 4. Force the '91' prefix if it isn't already there
    if (!cleanNumber.startsWith('91')) {
      cleanNumber = '91' + cleanNumber;
    }

    // 5. Open the deep-link chat box directly
    const whatsappUrl = `https://wa.me/${cleanNumber}`;
    window.open(whatsappUrl, '_blank', 'noopener,noreferrer');
  }
}
