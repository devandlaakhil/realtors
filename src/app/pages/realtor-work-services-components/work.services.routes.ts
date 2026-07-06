import { Routes } from '@angular/router';
import { authGuard } from '../../auth-services/auth.guard';

export const WORK_SERVICE_ROUTES: Routes = [
  { 
    path: '',  
    children: [
        {
            path:'home',
            loadComponent: () =>
              import('./realtor-work-services-landing-page-component/realtor-work-services-landing-page-component').then(
                (component) => component.RealtorWorkServicesLandingPageComponent,
              ),
        },
        {
          path:'commercial-vehicles',
          loadComponent:() => import('./services-providing-components/tractor-service-component/tractor-service-component').then(n => n.TractorServiceComponent)
        },
        {
          path:'tractor',
          redirectTo:'commercial-vehicles',
          pathMatch:'full'
        },
        {
          path:'edit-tractor/:id',
          canActivate: [authGuard],
          loadComponent:() => import('./services-providing-components/tractor-service-component/tractor-service-component').then(n => n.TractorServiceComponent)
        },
        {
          path:'workers',
          loadComponent:() => import('./services-providing-components/workers-service-component/workers-service-component').then(n => n.WorkersServiceComponent)
        },
        {
          path:'edit-worker/:id',
          canActivate: [authGuard],
          loadComponent:() => import('./services-providing-components/workers-service-component/workers-service-component').then(n => n.WorkersServiceComponent)
        },
        {
          path:'centring',
          loadComponent:() => import('./services-providing-components/centring-service-component/centring-service-component').then(n => n.CentringServiceComponent)
        },
        {
          path:'transport',
          loadComponent:() => import('./services-providing-components/transportation-service-component/transportation-service-component').then(n => n.TransportationServiceComponent)
        },
        {
          path:'edit-vehicle/:id',
          canActivate:[authGuard],
          loadComponent:() => import('./services-providing-components/transportation-service-component/transportation-service-component').then(n => n.TransportationServiceComponent)
        },
        {
          path :'repairs',
          loadComponent:() => import('./services-providing-components/hardware-shop-service-component/hardware-shop-service-component').then(n => n.HardwareShopServiceComponent)
        },
        {
          path :'hardware',
          redirectTo:'repairs',
          pathMatch:'full'
        },
        {
          path:'edit-repair/:id',
          canActivate:[authGuard],
          loadComponent:() => import('./services-providing-components/hardware-shop-service-component/hardware-shop-service-component').then(n => n.HardwareShopServiceComponent)
        },
        {
          path:'edit-hardware/:id',
          redirectTo:'edit-repair/:id',
          pathMatch:'full'
        },
        {
          path:'category-builder',
          canActivate:[authGuard],
          loadComponent: () =>
            import('./services-providing-components/dynamic-service-category-component/dynamic-service-category-component')
              .then((component) => component.DynamicServiceCategoryComponent)
        },
        {
          path:'dynamic/:slug',
          loadComponent: () =>
            import('./services-providing-components/dynamic-service-category-component/dynamic-service-category-component')
              .then((component) => component.DynamicServiceCategoryComponent)
        },
        {
          path:'drivers',
          loadComponent: () =>
            import('./services-providing-components/drivers-service-component/drivers-service-component')
              .then((component) => component.DriversServiceComponent)
        },
        {
          path:'edit-driver/:id',
          canActivate:[authGuard],
          loadComponent: () =>
            import('./services-providing-components/drivers-service-component/drivers-service-component')
              .then((component) => component.DriversServiceComponent)
        },
    ] 
  },
];
