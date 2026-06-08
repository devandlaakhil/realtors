import { CommonModule } from '@angular/common';
import { ChangeDetectorRef, Component, inject, OnInit } from '@angular/core';
import { forkJoin, Subject, takeUntil } from 'rxjs';
import { API_CONSTANTS } from '../../../../constants/realtors-services-api-constants';
import { RealtorsServicesApiServices } from '../../../../api-services/realtors-services-api-services';
import { LoaderServices } from '../../../../shared-services/loader-services';
import { TranslatePipe } from '../../../../pipes/translatepipe-pipe';
import { Router } from '@angular/router';
import { ToastrService } from 'ngx-toastr';

@Component({
  selector: 'app-service-postings-component',
  imports: [CommonModule, TranslatePipe],
  templateUrl: './service-postings-component.html',
  styleUrl: './service-postings-component.css',
})
export class ServicePostingsComponent implements OnInit {
  realtorApiSrv = inject(RealtorsServicesApiServices);
  loaderSrv = inject(LoaderServices);
  toaster = inject(ToastrService);
  router = inject(Router);
  destroy$ = new Subject<any>();
  cdr = inject(ChangeDetectorRef);

  serviceGroups: any[] = [];

  ngOnInit(): void {
    this.loadMyServices();
  }

  loadMyServices() {
    this.loaderSrv.show();
    forkJoin({
      tractors: this.realtorApiSrv.get(API_CONSTANTS.tractorServices.mylist),
      // cars: this.api.get('/cars'),
      // harvesters: this.api.get('/harvesters'),
      // cultivators: this.api.get('/cultivators'),
    }).subscribe({
      next: (res: any) => {
        this.serviceGroups = [
          {
            category: 'Tractors',
            icon: '🚜',
            items: res.tractors.data,
          },
          // {
          //   category: 'Cars',
          //   icon: '🚗',
          //   items: res.cars.data,
          // },
          // {
          //   category: 'Harvesters',
          //   icon: '🌾',
          //   items: res.harvesters.data,
          // },
          // {
          //   category: 'Cultivators',
          //   icon: '🛠️',
          //   items: res.cultivators.data,
          // },
        ].filter((group) => group.items?.length);
        this.loaderSrv.hide();
      },
      error: () => {
        this.loaderSrv.hide();
      },
    });
  }

  delete(elem: any) {
    const confirmed = confirm('Are you sure you want to delete this Tractor?');
    if (!confirmed) {
      return;
    }

    this.realtorApiSrv
      .delete(API_CONSTANTS.tractorServices.delete, { id: elem.id })
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (res) => {
          this.serviceGroups = this.serviceGroups
            .map((group) => ({
              ...group,
              items: group.items.filter((item: any) => item.id !== elem.id),
            }))
            .filter((group) => group.items.length > 0);

          this.toaster.success('Your tractor deleted sccessfully', 'Success');
          this.cdr.detectChanges();
        },
        error: () => {
          this.toaster.error('Soething went wrong', 'Fail');
        },
      });
  }

  edit(elem: any) {
    switch (elem.serviceType) {
      case 'Tractor':
        this.router.navigate(['/services/edit-tractor', elem.id]);
    }
  }

  toggleStatus(elem: any) {
    this.realtorApiSrv
      .patch(API_CONSTANTS.tractorServices.statusUpdate, { id: elem.id })
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (res: any) => {
          const isSuccess =
            res?.success === true ||
            res?.status === 'success' ||
            res?.status === 'SUCCESS' ||
            res?.message === 'success';

          if (!isSuccess) {
            this.toaster.error('Something went wrong', 'Fail');
            return;
          }

          const updatedStatus =
            res?.data?.status ??
            res?.statusValue ??
            res?.updatedStatus ??
            (elem.status === 'ACTIVE' ? 'INACTIVE' : 'ACTIVE');

          this.serviceGroups = this.serviceGroups.map((group) => ({
            ...group,
            items: group.items.map((item: any) =>
              item.id === elem.id ? { ...item, status: updatedStatus } : item
            ),
          }));

          this.toaster.success('Status updated successfully', 'Success');
          this.cdr.detectChanges();
        },
        error: () => {
          this.toaster.error('Something went wrong', 'Fail');
        },
      });
  }
}
