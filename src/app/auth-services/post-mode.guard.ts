import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { AuthService } from './auth-services';

export const postModeGuard: CanActivateFn = (route, state) => {
  const wantsPostMode = route.queryParamMap.get('post') === '1';
  if (!wantsPostMode) return true;

  const authService = inject(AuthService);
  if (authService.isLoggedIn()) return true;

  return inject(Router).createUrlTree(['/login'], {
    queryParams: { returnUrl: state.url },
  });
};
