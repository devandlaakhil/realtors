import { Routes } from '@angular/router';
import { authGuard } from '../../auth-services/auth.guard';

export const WORK_SERVICE_ROUTES: Routes = [
  { 
    path: '',  
    children: [
        {
            path:'home',
            loadComponent:() => import('./realtor-work-services-landing-page-component/realtor-work-services-landing-page-component').then(n => n.RealtorWorkServicesLandingPageComponent)
        },
        {
          path:'tractor',
          loadComponent:() => import('./services-providing-components/tractor-service-component/tractor-service-component').then(n => n.TractorServiceComponent)
        },
        {
          path:'edit-tractor/:id',
          canActivate: [authGuard],
          loadComponent:() => import('./services-providing-components/tractor-service-component/tractor-service-component').then(n => n.TractorServiceComponent)
        }
    ] 
  },
];
