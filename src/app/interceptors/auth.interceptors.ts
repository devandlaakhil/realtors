import { HttpContextToken, HttpErrorResponse, HttpInterceptorFn } from '@angular/common/http';
import { catchError } from 'rxjs/operators';
import { throwError } from 'rxjs';
import { inject } from '@angular/core';
import { AuthService } from '../auth-services/auth-services';
import { Router } from '@angular/router';
import { ToastrService } from 'ngx-toastr';

export const SKIP_AUTH_REDIRECT = new HttpContextToken<boolean>(() => false);
export const SKIP_AUTH_HEADER = new HttpContextToken<boolean>(() => false);

export const authInterceptor: HttpInterceptorFn = (req, next) => {
  const authService = inject(AuthService);
  const token = authService.getToken();
  const router = inject(Router);
  const toastr = inject(ToastrService);

  let clonedReq = req;

  if (token && !req.context.get(SKIP_AUTH_HEADER)) {
    clonedReq = req.clone({
      setHeaders: {
        Authorization: `Bearer ${token}`
      }
    });
  }

  return next(clonedReq).pipe(
    catchError((error: HttpErrorResponse) => {
      if (error.status === 401 && !req.context.get(SKIP_AUTH_REDIRECT)) {
        authService.logout();
        router.navigate(['/login']);
        // optionally redirect
      }else if(error.status === 403 && !req.context.get(SKIP_AUTH_REDIRECT)){
        toastr.warning("Please upgrade your plan to post your services");
        router.navigate(['/subscription']);
      }
      return throwError(() => error);
    })
  );
};
