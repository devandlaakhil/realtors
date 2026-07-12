import { ApplicationConfig, ErrorHandler, provideBrowserGlobalErrorListeners } from '@angular/core';
import { provideRouter, withHashLocation } from '@angular/router';

import { routes } from './app.routes';
//import { GlobalErrorHandler } from '../app/interceptors/global-error-handler';
import { provideToastr } from 'ngx-toastr';
import {
  provideHttpClient,
  withInterceptors,
  withInterceptorsFromDi,
  HttpClient,
  HTTP_INTERCEPTORS,
} from '@angular/common/http';
import { authInterceptor } from './interceptors/auth.interceptors';

import { provideTranslateService } from '@ngx-translate/core';
import { provideTranslateHttpLoader } from '@ngx-translate/http-loader';
import { LoaderInterceptors } from './interceptors/loader.interceptors';
import { AppGlobalErrorHandler } from './shared-services/error-log.service';
import { ErrorLogInterceptor } from './interceptors/error-log.interceptor';

export const appConfig: ApplicationConfig = {
  providers: [
    provideBrowserGlobalErrorListeners(),
    provideRouter(routes, withHashLocation()),
    provideToastr({
      maxOpened: 1,
      autoDismiss: true,
      preventDuplicates: true,
      closeButton: true,
      progressBar: true,
      timeOut: 3500,
    }),
    provideHttpClient(withInterceptors([authInterceptor]), withInterceptorsFromDi()),
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
    {
      provide: HTTP_INTERCEPTORS,
      useClass: ErrorLogInterceptor,
      multi: true,
    },
    {
      provide: ErrorHandler,
      useClass: AppGlobalErrorHandler,
    },
  ],
};
