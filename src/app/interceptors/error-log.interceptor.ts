import { HttpErrorResponse, HttpEvent, HttpHandler, HttpInterceptor, HttpRequest } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable, catchError, throwError } from 'rxjs';
import { ErrorLogService } from '../shared-services/error-log.service';

@Injectable()
export class ErrorLogInterceptor implements HttpInterceptor {
  private readonly logs = inject(ErrorLogService);

  intercept(req: HttpRequest<unknown>, next: HttpHandler): Observable<HttpEvent<unknown>> {
    return next.handle(req).pipe(
      catchError((error: HttpErrorResponse) => {
        if (!req.url.includes('/error_logs')) {
          this.logs.log({
            source: 'http',
            action: req.method,
            message: `${req.method} ${req.url}`,
            details: error,
          });
        }
        return throwError(() => error);
      })
    );
  }
}

