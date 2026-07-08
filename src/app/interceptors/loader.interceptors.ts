import { HttpEvent, HttpHandler, HttpInterceptor, HttpRequest } from '@angular/common/http';

import { inject, Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { finalize } from 'rxjs/operators';
import { LoaderServices } from '../shared-services/loader-services';

@Injectable()
export class LoaderInterceptors implements HttpInterceptor {
  loaderService = inject(LoaderServices);
  intercept(req: HttpRequest<any>, next: HttpHandler): Observable<HttpEvent<any>> {
    let shown = false;
    const timer = setTimeout(() => {
      shown = true;
      this.loaderService.show();
    }, 180);

    return next.handle(req).pipe(
      finalize(() => {
        clearTimeout(timer);
        if (shown) {
          this.loaderService.hide();
        }
      }),
    );
  }
}
