import { Routes } from '@angular/router';

export const routes: Routes = [
    {
        path:'',
        loadComponent : () => import('../app/pages/home-components/homecomponent/homecomponent').then(m => m.Homecomponent)
    }
];
