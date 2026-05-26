import { CommonModule } from '@angular/common';
import { ChangeDetectorRef, Component, inject, OnInit } from '@angular/core';
import { RouterModule } from '@angular/router';
import { ToastrService } from 'ngx-toastr';
import { Subject, takeUntil } from 'rxjs';
import { RealEstateApiService } from '../../../api-services/realestate-api-services';

@Component({
  selector: 'app-homecomponent',
  imports: [CommonModule, RouterModule],
  templateUrl: './homecomponent.html',
  styleUrl: './homecomponent.css',
})
export class Homecomponent implements OnInit {

  properties: any = [];
  realEstateApiSrv = inject(RealEstateApiService);
  destroy$ = new Subject<any>();
  toastr = inject(ToastrService);
  cdr = inject(ChangeDetectorRef);


   ngOnInit(): void {
    this.getAllProperites();
  }

  getAllProperites() {
    this.realEstateApiSrv
      .getAllList()
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (res) => {
          this.properties = res.data;
          this.cdr.detectChanges();
        },
        error: () => {
          this.toastr.error('Something went wrong', 'Fail');
        },
      });
  }

  getMainImage(images: any[]): string {
    if (!images || images.length === 0) {
      return '';
    }
    const mainImage = images.find((img) => img.type === 'main');
    const image = mainImage?.url || images[0]?.url;
    return image;
  }
}
