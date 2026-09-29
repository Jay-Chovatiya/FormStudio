import { Routes } from '@angular/router';
import { authGuard, guestGuard } from './core/guards/auth.guard';

export const routes: Routes = [
  {
    path: 'login',
    loadComponent: () =>
      import('./features/auth/login/login.component').then(
        (m) => m.LoginComponent
      ),
    canActivate: [guestGuard],
    title: 'Sign In - FormStudio',
  },
  {
    path: '',
    redirectTo: 'forms',
    pathMatch: 'full',
  },
  {
    path: 'forms',
    loadComponent: () =>
      import('./features/form-list/form-list.component').then(
        (m) => m.FormListComponent
      ),
    canActivate: [authGuard],
    title: 'Form Library - FormStudio',
  },
  {
    path: 'form-builder',
    loadComponent: () =>
      import('./features/form-builder/form-builder.component').then(
        (m) => m.FormBuilderComponent
      ),
    canActivate: [authGuard],
    title: 'Form Builder - FormStudio',
  },
  {
    path: 'forms/:id/fill',
    loadComponent: () =>
      import('./features/form-fill/dynamic-form/dynamic-form.component')
        .then(m => m.DynamicFormComponent),
    title: 'Fill Form - FormStudio',
  },
  {
    path: 'forms/:id/preview',
    loadComponent: () =>
      import('./features/form-preview/form-preview/form-preview.component')
        .then(m => m.FormPreviewComponent),
    title: 'Form Preview - FormStudio',
  },
  {
    path: 'forms/:id/responses',
    loadComponent: () =>
      import('./features/form-responses/form-responses.component')
        .then(m => m.FormResponsesComponent),
    title: 'Form Responses - FormStudio',
  },
  {
    path: 'users',
    loadComponent: () =>
      import('./features/user-management/user-management.component').then(
        (m) => m.UserManagementComponent
      ),
    canActivate: [authGuard],
    data: { role: 'SuperAdministrator' },
    title: 'User Management - FormStudio',
  },
  {
    path: '**',
    redirectTo: 'forms',
  },
];
