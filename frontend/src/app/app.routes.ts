import { Routes } from '@angular/router';
import { FormListComponent } from './features/form-list/form-list.component';
import { FormBuilderComponent } from './features/form-builder/form-builder.component';

export const routes: Routes = [
  {
    path: '',
    component: FormListComponent,
    title: 'Form Library - FormStudio',
  },
  {
    path: 'forms',
    component: FormListComponent,
    title: 'Form Library - FormStudio',
  },
  {
    path: 'form-builder',
    component: FormBuilderComponent,
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
];
