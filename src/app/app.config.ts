import { ApplicationConfig, provideBrowserGlobalErrorListeners } from '@angular/core';
import { provideRouter,withHashLocation } from '@angular/router';

import { routes } from './app.routes';
//import { GlobalErrorHandler } from '../app/interceptors/global-error-handler';
import {provideToastr} from 'ngx-toastr';

export const appConfig: ApplicationConfig = {
  providers: [
    provideBrowserGlobalErrorListeners(),
    provideRouter(routes, withHashLocation()),
     provideToastr(),
  ]
};
