import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { SesionService } from '../servicios/sesion.service';

export const auntenticacionGuard: CanActivateFn = (route, state) => {
  const router = inject(Router);
  const sesionService = inject(SesionService);

  if (typeof(Storage) !== 'undefined'){
    if ('token' in localStorage && localStorage.getItem('token')){
      if (sesionService.isTokenExpirado()) {
        localStorage.clear();
        router.navigate(['/login']);
        return false;
      }
      return true;
    } else {
      router.navigate(['/login']);
      return false;
    }
  } else {
    router.navigate(['/login']);
    return false;
  }
};
