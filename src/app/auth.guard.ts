import { inject } from '@angular/core';
import { Router } from '@angular/router';
import { Auth, user } from '@angular/fire/auth';
import { map } from 'rxjs/operators';

export const authGuard = () => {
  const auth = inject(Auth);
  const router = inject(Router);

  return user(auth).pipe(
    map((user) => {
      if (user) {
        return true;
      }
      router.navigate(['/login']);
      return false;
    })
  );
};
