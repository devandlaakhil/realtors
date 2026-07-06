import { CommonModule } from '@angular/common';
import { ChangeDetectorRef, Component, inject, OnInit } from '@angular/core';
import { forkJoin, map, Subject, switchMap, takeUntil } from 'rxjs';
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
import { DynamicCategoryApiService, DynamicServiceCategory } from '../../../../api-services/dynamic-category-api-service';
import { AuthService } from '../../../../auth-services/auth-services';
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
  dynamicApi = inject(DynamicCategoryApiService);
  authService = inject(AuthService);

  loaderSrv = inject(LoaderServices);
  toaster = inject(ToastrService);
  router = inject(Router);
  destroy$ = new Subject<any>();
  cdr = inject(ChangeDetectorRef);

  serviceGroups: any[] = [];

  private statusApis: any = {
    Tractor: {
      service: this.realtorApiSrv,
      url: API_CONSTANTS.commercialVehicleServices.statusUpdate,
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
      url: API_CONSTANTS.commercialVehicleServices.delete,
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
      commercialVehicles: this.realtorApiSrv.get(API_CONSTANTS.commercialVehicleServices.mylist),
      workers: this.workerApiSrv.get(API_CONSTANTS.workerapiServices.getMyPostings),
      vehicles : this.transportApiSrv.get(API_CONSTANTS.transportApiService.getMyVehiclePosts),
      hardware: this.hardwareApiSrv.getMyShops(),
      // cultivators: this.api.get('/cultivators'),
    }).subscribe({
      next: (res: any) => {
        this.serviceGroups = [
          {
            category: 'Commercial Vehicles',
            icon: '🚜',
            items: (res.commercialVehicles?.data || []).map((x: any) => mapTractor(x)),
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
            category: 'Home Repairs',
            icon: 'Home Repairs',
            items: (res.hardware?.data || res.hardware?.shops || []).map((x: any) => mapHardware(x)),
          },
          // {
          //   category: 'Cultivators',
          //   icon: '🛠️',
          //   items: res.cultivators.data,
          // },
        ].filter((group) => group.items?.length);
        this.loadMyDynamicServices();
        this.loaderSrv.hide();
      },
      error: () => {
        this.loaderSrv.hide();
      },
    });
  }

  private loadMyDynamicServices(): void {
    const userId = String(this.authService.getUser()?.id || '');
    if (!userId) return;

    this.dynamicApi.loadPublished().pipe(
      switchMap((response: any) => {
        const categories: DynamicServiceCategory[] =
          response?.data ?? response?.categories ?? response ?? [];
        if (!Array.isArray(categories) || !categories.length) return [[]];
        return forkJoin(categories.map((category) =>
          this.dynamicApi.getPosts(category.slug, { userId, mine: true }).pipe(
            map((postsResponse: any) => ({ category, postsResponse })),
          ),
        ));
      }),
      takeUntil(this.destroy$),
    ).subscribe({
      next: (results: any[]) => {
        const dynamicGroups = results.map(({ category, postsResponse }: any) => {
          const data = postsResponse?.data ?? postsResponse?.posts ?? postsResponse ?? [];
          const posts = Array.isArray(data) ? data.filter((post: any) => {
            const ownerId = post.userId ?? post.clientid ?? post.createdBy?._id ??
              post.createdBy?.id ?? post.ownerId;
            return !ownerId || String(ownerId) === userId;
          }) : [];
          return {
            category: category.name,
            icon: category.iconUrl || '',
            dynamic: true,
            items: posts.map((post: any) => ({
              id: post.id || post._id,
              title: post.title || post.data?.title || post.data?.name || post.name || category.name,
              price: post.price || post.data?.price || post.data?.amount || post.amount || '',
              unit: post.unit || post.data?.unit || '',
              location: post.location?.address || post.data?.address || post.address || post.village || '',
              image: this.dynamicPostImage(post, category),
              isActive: post.status !== 'INACTIVE',
              category: 'Dynamic',
              dynamicSlug: category.slug,
              originalData: post,
            })),
          };
        }).filter((group: any) => group.items.length);
        this.serviceGroups = [
          ...this.serviceGroups.filter((group) => !group.dynamic),
          ...dynamicGroups,
        ];
        this.cdr.detectChanges();
      },
      error: () => undefined,
    });
  }

  private dynamicPostImage(post: any, category: DynamicServiceCategory): string {
    const imageField = category.fields?.find((field) => field.type === 'image');
    const value = imageField
      ? post?.data?.[imageField.key] ??
        post?.values?.[imageField.key] ??
        post?.payload?.[imageField.key] ??
        post?.[imageField.key]
      : null;
    const fallbackImages = post?.images ?? post?.data?.images;
    const image = Array.isArray(value)
      ? value[0]
      : value || (Array.isArray(fallbackImages) ? fallbackImages[0] : fallbackImages);
    return image?.url || image || category.iconUrl || '/images/realtors.png';
  }

  delete(elem: any) {
    if (elem.category === 'Dynamic') {
      if (!confirm('Are you sure you want to delete this post?')) return;
      this.dynamicApi.deletePost(elem.dynamicSlug, elem.id)
        .pipe(takeUntil(this.destroy$))
        .subscribe({
          next: () => {
            this.serviceGroups = this.serviceGroups
              .map((group) => ({
                ...group,
                items: group.items.filter((item: any) => item.id !== elem.id),
              }))
              .filter((group) => group.items.length);
            this.toaster.success('Post deleted successfully', 'Success');
            this.cdr.detectChanges();
          },
          error: () => undefined,
        });
      return;
    }
    const apiConfig = this.deleteApis[elem.category];
    if (!apiConfig) {
      this.toaster.error('Delete not supported for this service', 'Error');
      return;
    }
    const confirmed = confirm('Are you sure you want to delete this commercial vehicle?');
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

            this.toaster.success('Your commercial vehicle was deleted successfully', 'Success');
            this.cdr.detectChanges();
          }
        },
        error: () => {
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
        this.router.navigate(['/services/edit-repair',elem.id]);
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
        },
      });
  }
}
