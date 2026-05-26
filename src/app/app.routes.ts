import { Routes } from '@angular/router';

export const routes: Routes = [
    {
        path:'',
        loadComponent : () => import('../app/pages/home-components/homecomponent/homecomponent').then(m => m.Homecomponent)
    },
    {
        path : 'login',
        loadComponent: () => import('../app/pages/user-components/user-login-component/user-login-component').then(m => m.UserLoginComponent)
    },
    {
        path : 'register',
        loadComponent : () => import('../app/pages/user-components/user-register-component/user-register-component').then(m => m.UserRegisterComponent)
    }
];
