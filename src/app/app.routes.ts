import { Routes } from '@angular/router';
import { authGuard } from './auth-services/auth.guard';
import { DashboardComponent } from '../app/pages/home-components/dashboard-component/dashboard-component';

export const routes: Routes = [
  {
    path: '',
    redirectTo: 'services/home',
    pathMatch: 'full',
  },
  {
    path: 'home',
    loadComponent: () =>
      import('../app/pages/home-components/homecomponent/homecomponent').then(
        (m) => m.Homecomponent,
      ),
  },
  {
    path: 'login',
    loadComponent: () =>
      import('../app/pages/user-components/user-login-component/user-login-component').then(
        (m) => m.UserLoginComponent,
      ),
  },
  {
    path: 'register',
    loadComponent: () =>
      import('../app/pages/user-components/user-register-component/user-register-component').then(
        (m) => m.UserRegisterComponent,
      ),
  },
  {
    path: 'ad-post',
    canActivate: [authGuard],
    loadComponent: () =>
      import('../app/pages/services-components/ad-posting-services-component/ad-posting-services-component').then(
        (m) => m.AdPostingServicesComponent,
      ),
  },
  {
    path:'profile',
    canActivate: [authGuard],
    loadComponent: () => import('../app/pages/user-components/user-profile-component/user-profile-component').then(m => m.UserProfileComponent)
  },
  {
    path: 'ad-post/:id',
    canActivate: [authGuard],
    loadComponent: () =>
      import('../app/pages/services-components/ad-posting-services-component/ad-posting-services-component').then(
        (m) => m.AdPostingServicesComponent,
      ),
  },
  {
    path: 'dashboard',
    canActivate: [authGuard],
    loadComponent: () =>
      import('../app/pages/home-components/dashboard-component/dashboard-component').then(
        (m) => m.DashboardComponent,
      ),
  },
  {
    path: 'property/:id',
    loadComponent: () =>
      import('../app/pages/home-components/product-view-component/product-view-component').then(
        (m) => m.ProductViewComponent,
      ),
  },
  {
    path: 'query/:id',
    canActivate: [authGuard],
    loadComponent: () =>
      import('../app/pages/home-components/send-query-component/send-query-component').then(
        (m) => m.SendQueryComponent,
      ),
  },
  {
    path: 'conversation/:conversationId/:propertyId',
    canActivate: [authGuard],
    loadComponent: () =>
      import('../app/pages/home-components/send-query-component/send-query-component').then(
        (m) => m.SendQueryComponent,
      ),
  },
  {
    path: 'contact-us',
    loadComponent: () =>
      import('../app/pages/services-components/contact-us-component/contact-us-component').then(
        (m) => m.ContactUsComponent,
      ),
  },
  {
    path: 'about',
    loadComponent: () =>
      import('../app/pages/services-components/about-component/about-component').then(
        (m) => m.AboutComponent,
      ),
  },
  {
    path : 'subscription',
    canActivate: [authGuard],
    loadComponent:() => import('../app/pages/subscription-components/subscription-screen-component/subscription-screen-component').then(m => m.SubscriptionScreenComponent)
  },
  {
    path: 'dashboard',
    component: DashboardComponent,
    children: [
      {
        path: 'my-posts',
        loadComponent: () =>
          import('../app/pages/services-components/dashboard-components/my-postings-component/my-postings-component').then(
            (m) => m.MyPostingsComponent,
          ),
      },
      {
        path : 'services',
        loadComponent: () => 
          import('../app/pages/services-components/dashboard-components/service-postings-component/service-postings-component').then(
            m => m.ServicePostingsComponent
          )
      },
      {
        path: 'advertisement',
        loadComponent: () =>
          import('../app/pages/services-components/dashboard-components/post-advertisement-component/post-advertisement-component').then(
            (m) => m.PostAdvertisementComponent,
          )
      },
      {
        path: 'home',
        loadComponent: () =>
          import('../app/pages/services-components/dashboard-components/dashboard-home-component/dashboard-home-component').then(
            (m) => m.DashboardHomeComponent,
          ),
      },
    ],
  },
  {
    path:'services',
    loadChildren: () => import('../app/pages/realtor-work-services-components/work.services.routes').then(m => m.WORK_SERVICE_ROUTES)
  }
];
