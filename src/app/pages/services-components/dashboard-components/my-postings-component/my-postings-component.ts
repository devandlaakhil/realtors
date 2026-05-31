import { ChangeDetectorRef, Component, inject, OnInit } from '@angular/core';
import { RealEstateApiService } from '../../../../api-services/realestate-api-services';
import { CommonModule } from '@angular/common';
import { Subject, takeUntil } from 'rxjs';
import { ToastrService } from 'ngx-toastr';

@Component({
  selector: 'app-my-postings-component',
  imports: [CommonModule],
  templateUrl: './my-postings-component.html',
  styleUrl: './my-postings-component.css',
})
export class MyPostingsComponent implements OnInit{
  properties:any = [];
  realEstateApiSrc = inject(RealEstateApiService);
  destroy$ = new Subject<any>();
  tostrService = inject(ToastrService);
  cdr = inject(ChangeDetectorRef);

  ngOnInit(): void {
    this.getMyPostings();
  }

  getMyPostings(){
    this.realEstateApiSrc.getMyProperties()
    .pipe(takeUntil(this.destroy$))
    .subscribe({
      next : (res:any) => {
        this.properties = res;
        this.cdr.detectChanges();
      },
      error : () => {
        this.tostrService.error('Something went wrong','Fail');
      }
    })
  }
}
