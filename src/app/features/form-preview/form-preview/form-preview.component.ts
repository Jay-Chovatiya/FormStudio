import { Component, inject } from '@angular/core';
import { FormBuilderState } from '../../../core/services/form-builder-state';
import { DynamicFormComponent } from '../../form-fill/dynamic-form/dynamic-form.component';

@Component({
  imports: [DynamicFormComponent],
  selector: 'app-form-preview',
  styleUrl: './form-preview.component.scss',
  templateUrl: './form-preview.component.html',
})
export class FormPreviewComponent {
  private readonly formBuilderState = inject(FormBuilderState);

  readonly form = this.formBuilderState.form;
}
