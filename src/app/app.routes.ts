import { Routes } from '@angular/router';
import { authGuard } from './auth.guard';

export const routes: Routes = [
  {
    path: '',
    redirectTo: '/groups',
    pathMatch: 'full',
  },
  {
    path: 'login',
    loadComponent: () => import('./auth/login/login').then((m) => m.Login),
  },
  {
    path: 'signup',
    loadComponent: () => import('./auth/signup/signup').then((m) => m.Signup),
  },
  {
    path: 'groups',
    canActivate: [authGuard],
    loadComponent: () => import('./group/group-list/group-list').then((m) => m.GroupList),
  },
  {
    path: 'groups/:id',
    canActivate: [authGuard],
    loadComponent: () => import('./group/group-detail/group-detail').then((m) => m.GroupDetail),
  },
  {
    path: '**',
    redirectTo: '/groups',
  },
];
