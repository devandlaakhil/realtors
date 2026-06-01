import { ChangeDetectorRef, Component, inject, OnInit } from '@angular/core';
import { RealEstateApiService } from '../../../../api-services/realestate-api-services';
import { CommonModule } from '@angular/common';
import { Subject, takeUntil } from 'rxjs';
import { ToastrService } from 'ngx-toastr';
import { Router } from '@angular/router';

@Component({
  selector: 'app-my-postings-component',
  imports: [CommonModule],
  templateUrl: './my-postings-component.html',
  styleUrl: './my-postings-component.css',
})
export class MyPostingsComponent implements OnInit {
  properties: any = [];
  realEstateApiSrc = inject(RealEstateApiService);
  destroy$ = new Subject<any>();
  tostrService = inject(ToastrService);
  cdr = inject(ChangeDetectorRef);
  router = inject(Router);
  ngOnInit(): void {
    this.getMyPostings();
  }

  getMyPostings() {
    this.realEstateApiSrc
      .getMyProperties()
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (res: any) => {
          this.properties = res;
          this.cdr.detectChanges();
        },
        error: () => {
          this.tostrService.error('Something went wrong', 'Fail');
        },
      });
  }

  edit(property: any) {
    this.router.navigate(['/ad-post', property.id]);
  }

  availability(e: string) {
    this.realEstateApiSrc
      .updateAvailabilityStatus(e)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: () => {
          this.tostrService.success('Success', 'Success');
          this.getMyPostings();
        },
        error: () => {
          this.tostrService.error('Something went wrong', 'Fail');
        },
      });
  }

  delete(e: string) {
    const confirmed = confirm('Are you sure you want to delete this property?');

    if (!confirmed) {
      return;
    }

    this.realEstateApiSrc
      .deleteMyPost(e)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: () => {
          this.properties = this.properties.filter((elem: any) => elem.id !== e);

          this.tostrService.success('Post deleted successfully', 'Success');
        },

        error: () => {
          this.tostrService.error('Something went wrong', 'Fail');
        },
      });
  }
}
