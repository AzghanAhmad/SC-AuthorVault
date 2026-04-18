import { Routes } from '@angular/router';

export const routes: Routes = [
  { path: '', redirectTo: '/login', pathMatch: 'full' },
  {
    path: 'login',
    loadComponent: () => import('./components/pages/login/login.component').then(m => m.LoginComponent)
  },
  {
    path: 'signup',
    loadComponent: () => import('./components/pages/signup/signup.component').then(m => m.SignupComponent)
  },
  {
    path: 'dashboard',
    loadComponent: () => import('./components/pages/dashboard/dashboard.component').then(m => m.DashboardComponent)
  },
  {
    path: 'books',
    loadComponent: () => import('./components/pages/books/books.component').then(m => m.BooksComponent)
  },
  {
    path: 'books/:id',
    loadComponent: () => import('./components/pages/book-detail/book-detail.component').then(m => m.BookDetailComponent)
  },
  {
    path: 'settings',
    loadComponent: () => import('./components/pages/settings/settings.component').then(m => m.SettingsComponent)
  },
  { path: '**', redirectTo: '/login' }
];
