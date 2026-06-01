import { ChangeDetectorRef, Component, inject } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { ToastrService } from 'ngx-toastr';
import { Subject, takeUntil } from 'rxjs';
import { CommonModule, DecimalPipe } from '@angular/common';
import { RealEstateApiService } from '../../../api-services/realestate-api-services';
import { DomSanitizer, SafeResourceUrl } from '@angular/platform-browser';

@Component({
  selector: 'app-product-view-component',
  imports: [CommonModule, DecimalPipe],
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
            this.toastr.error('Something went wrong', 'Fail');
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
}
