import { ApplicationConfig, provideBrowserGlobalErrorListeners } from '@angular/core';
import { provideRouter, withHashLocation } from '@angular/router';

import { routes } from './app.routes';
//import { GlobalErrorHandler } from '../app/interceptors/global-error-handler';
import { provideToastr } from 'ngx-toastr';
import {
  provideHttpClient,
  withInterceptors,
  HttpClient,
  HTTP_INTERCEPTORS,
} from '@angular/common/http';
import { authInterceptor } from './interceptors/auth.interceptors';

import { provideTranslateService } from '@ngx-translate/core';
import { provideTranslateHttpLoader } from '@ngx-translate/http-loader';
import { LoaderInterceptors } from './interceptors/loader.interceptors';

export const appConfig: ApplicationConfig = {
  providers: [
    provideBrowserGlobalErrorListeners(),
    provideRouter(routes, withHashLocation()),
    provideToastr(),
    provideHttpClient(withInterceptors([authInterceptor])),
    provideTranslateService({
      loader: provideTranslateHttpLoader({
        prefix: './assets/i18n/',
        suffix: '.json',
      }),
    }),
    {
      provide: HTTP_INTERCEPTORS,
      useClass: LoaderInterceptors,
      multi: true,
    },
  ],
};
