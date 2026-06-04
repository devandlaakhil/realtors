import { HttpEvent, HttpHandler, HttpInterceptor, HttpRequest } from '@angular/common/http';

import { inject, Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { finalize } from 'rxjs/operators';
import { LoaderServices } from '../shared-services/loader-services';

@Injectable()
export class LoaderInterceptors implements HttpInterceptor {
  loaderService = inject(LoaderServices);
  intercept(req: HttpRequest<any>, next: HttpHandler): Observable<HttpEvent<any>> {
    this.loaderService.show();

    return next.handle(req).pipe(
      finalize(() => {
        this.loaderService.hide();
      }),
    );
  }
}
