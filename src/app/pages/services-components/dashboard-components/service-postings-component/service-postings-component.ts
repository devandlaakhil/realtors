import { CommonModule } from '@angular/common';
import { ChangeDetectorRef, Component, inject, OnInit } from '@angular/core';
import { forkJoin, Subject, takeUntil } from 'rxjs';
import { API_CONSTANTS } from '../../../../constants/realtors-services-api-constants';
import { RealtorsServicesApiServices } from '../../../../api-services/realtors-services-api-services';
import { LoaderServices } from '../../../../shared-services/loader-services';
import { TranslatePipe } from '../../../../pipes/translatepipe-pipe';
import { Router } from '@angular/router';
import { ToastrService } from 'ngx-toastr';
import { WorkerApiServices } from '../../../../api-services/worker-api-services';
import { mapHardware, mapTractor, mapWorker,mapVehicle } from '../../../../constants/service-mappers';
import { TransportApiService } from '../../../../api-services/transport-api-service';
import { HardwareShopApiService } from '../../../../api-services/hardware-shop-api-service';
@Component({
  selector: 'app-service-postings-component',
  imports: [CommonModule, TranslatePipe],
  templateUrl: './service-postings-component.html',
  styleUrl: './service-postings-component.css',
})
export class ServicePostingsComponent implements OnInit {
  realtorApiSrv = inject(RealtorsServicesApiServices);
  workerApiSrv = inject(WorkerApiServices);
  transportApiSrv = inject(TransportApiService);
  hardwareApiSrv = inject(HardwareShopApiService);

  loaderSrv = inject(LoaderServices);
  toaster = inject(ToastrService);
  router = inject(Router);
  destroy$ = new Subject<any>();
  cdr = inject(ChangeDetectorRef);

  serviceGroups: any[] = [];

  private statusApis: any = {
    Tractor: {
      service: this.realtorApiSrv,
      url: API_CONSTANTS.tractorServices.statusUpdate,
    },
    Worker: {
      service: this.workerApiSrv,
      url: API_CONSTANTS.workerapiServices.statusUpdate,
    },
    Vehicles : {
      service : this.transportApiSrv,
      url : API_CONSTANTS.transportApiService.updateVehicleStatus,
    },
    Hardware: {
      service: this.hardwareApiSrv,
      action: (id: string) => this.hardwareApiSrv.updateStatus(id),
    },
  };

  private deleteApis: any = {
    Tractor: {
      service: this.realtorApiSrv,
      url: API_CONSTANTS.tractorServices.delete,
    },
    Worker: {
      service: this.workerApiSrv,
      url: API_CONSTANTS.workerapiServices.delete,
    },
    Vehicles: {
      service : this.transportApiSrv,
      url : API_CONSTANTS.transportApiService.delete,
    },
    Hardware: {
      service: this.hardwareApiSrv,
      action: (id: string) => this.hardwareApiSrv.deleteShop(id),
    },
  };

  ngOnInit(): void {
    this.loadMyServices();
  }

  loadMyServices() {
    this.loaderSrv.show();
    forkJoin({
      tractors: this.realtorApiSrv.get(API_CONSTANTS.tractorServices.mylist),
      workers: this.workerApiSrv.get(API_CONSTANTS.workerapiServices.getMyPostings),
      vehicles : this.transportApiSrv.get(API_CONSTANTS.transportApiService.getMyVehiclePosts),
      hardware: this.hardwareApiSrv.getMyShops(),
      // cultivators: this.api.get('/cultivators'),
    }).subscribe({
      next: (res: any) => {
        this.serviceGroups = [
          {
            category: 'Tractors',
            icon: '🚜',
            items: (res.tractors?.data || []).map((x: any) => mapTractor(x)),
          },
          {
            category: 'workers',
            icon: '👷‍♂️',
            items: (res.workers?.data || []).map((x: any) => mapWorker(x)),
          },
          {
            category: 'Vehicles',
            icon: '🚛',
            items: (res.vehicles?.data || []).map((x:any) => mapVehicle(x)),
          },
          {
            category: 'Hardware',
            icon: 'Hardware',
            items: (res.hardware?.data || res.hardware?.shops || []).map((x: any) => mapHardware(x)),
          },
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
    const apiConfig = this.deleteApis[elem.category];
    if (!apiConfig) {
      this.toaster.error('Delete not supported for this service', 'Error');
      return;
    }
    const confirmed = confirm('Are you sure you want to delete this Tractor?');
    if (!confirmed) {
      return;
    }

    const deleteRequest = apiConfig.action
      ? apiConfig.action(elem.id)
      : apiConfig.service.delete(apiConfig.url, { id: elem.id });

    deleteRequest
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (res: any) => {
          if (res) {
            this.serviceGroups = this.serviceGroups
              .map((group) => ({
                ...group,
                items: group.items.filter((item: any) => item.id !== elem.id),
              }))
              .filter((group) => group.items.length > 0);

            this.toaster.success('Your tractor deleted sccessfully', 'Success');
            this.cdr.detectChanges();
          }
        },
        error: () => {
          this.toaster.error('Something went wrong', 'Fail');
        },
      });
  }

  edit(elem: any) {
    switch (elem.category) {
      case 'Tractor':
        this.router.navigate(['/services/edit-tractor', elem.id]);
        break;
      case 'Worker':
        this.router.navigate(['/services/edit-worker', elem.id]);
        break;
      case 'Vehicles':
        this.router.navigate(['/services/edit-vehicle', elem.id]);
        break;
      case 'Hardware':
        this.router.navigate(['/services/edit-hardware',elem.id]);
        break;
    }
  }

  toggleStatus(elem: any) {
    const apiConfig = this.statusApis[elem.category];
    if (!apiConfig) {
      this.toaster.error('Status update not supported for this service', 'Error');
      return;
    }
    const statusRequest = apiConfig.action
      ? apiConfig.action(elem.id)
      : apiConfig.service.patch(apiConfig.url, { id: elem.id });

    statusRequest
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

          const updatedStatus = res?.data?.status ?? (elem.isActive ? 'INACTIVE' : 'ACTIVE');
          const isActive = updatedStatus === 'ACTIVE';

          this.serviceGroups = this.serviceGroups.map((group) => ({
            ...group,
            items: group.items.map((x: any) =>
              x.id === elem.id
                ? {
                    ...x,
                    isActive,
                    originalData: {
                      ...x.originalData,
                      status: updatedStatus,
                    },
                  }
                : x,
            ),
          }));

          this.toaster.success('Status updated successfully', 'Success');
        },
        error: () => {
          this.toaster.error('Something went wrong', 'Fail');
        },
      });
  }
}
