import { Routes } from '@angular/router';
import { DynamicFormComponent } from './features/form-fill/dynamic-form/dynamic-form.component';
import { FormBuilderComponent } from './features/form-builder/form-builder.component';

export const routes: Routes = [
  {
    path: '',
    component: DynamicFormComponent,
    title: 'Dynamic Form',
  },
  {
    path: 'form-builder',
    component: FormBuilderComponent,
    title: 'Form Builder',
  },
  {
    path: 'forms/:id/preview',
    loadComponent: () =>
      import('./features/form-preview/form-preview/form-preview.component')
        .then(m => m.FormPreviewComponent),
  },
];
