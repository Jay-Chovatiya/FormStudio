import { Component, inject } from '@angular/core';
import { FormBuilderState } from '../../../core/services/form-builder-state';
import { DynamicFormComponent } from '../../form-fill/dynamic-form/dynamic-form.component';
import { Router } from '@angular/router';

@Component({
  imports: [DynamicFormComponent],
  selector: 'app-form-preview',
  styleUrl: './form-preview.component.scss',
  templateUrl: './form-preview.component.html',
})
export class FormPreviewComponent {
  private readonly formBuilderState = inject(FormBuilderState);
  private readonly router = inject(Router);

  readonly form = this.formBuilderState.form;

  backToBuilder(): void {
    const currentForm = this.form();
    if (currentForm && currentForm.id && typeof currentForm.id === 'number' && currentForm.id < 1000000000) {
      this.router.navigate(['/form-builder'], {
        queryParams: { id: currentForm.id },
        state: { fromPreview: true }
      });
    } else {
      this.router.navigate(['/form-builder'], {
        state: { fromPreview: true }
      });
    }
  }
}
