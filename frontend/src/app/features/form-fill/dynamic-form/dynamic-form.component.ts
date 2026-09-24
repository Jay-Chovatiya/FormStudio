import { Component, inject, input, signal, OnInit } from '@angular/core';
import { FormField } from '../../../core/models/form-field';
import {
  FormGroup,
  FormControl,
  ReactiveFormsModule,
  Validators,
  ValidatorFn,
  AbstractControl,
} from '@angular/forms';
import { FieldValidation } from '../../../core/models/field-validation';
import { FieldTypes } from '../../../core/models/field-types';
import { FormResponse } from '../../../core/models/form-response';
import { FormSubmission } from '../../../core/models/form-submission';
import { FormDefinition } from '../../../core/models/form-definition';
import { MockBackendService } from '../../../core/services/mock-backend.service';
import { TitleCasePipe } from '@angular/common';
import { DatePickerComponent } from '../../../shared/components/date-picker/date-picker.component';

@Component({
  imports: [ReactiveFormsModule, TitleCasePipe, DatePickerComponent],
  selector: 'app-dynamic-form',
  styleUrl: './dynamic-form.component.scss',
  templateUrl: './dynamic-form.component.html',
})
export class DynamicFormComponent implements OnInit {
  readonly formDefinition = input<FormDefinition | null>(null);
  readonly isPreview = input<boolean>(false);
  private readonly mockBackendService = inject(MockBackendService);
  submitted = signal(false);

  form = new FormGroup<Record<string, AbstractControl>>({});

  ngOnInit(): void {
    const formDefinition = this.formDefinition();
    if (!formDefinition) return;
    this.createForm(formDefinition);
  }

  createForm(formDefinition: FormDefinition): void {
    this.form = new FormGroup<Record<string, AbstractControl>>({});
    formDefinition.sections.forEach((section) => {
      if (!section.visibility) return;
      section.fields.forEach((field) => {
        if (!field.visibility) return;
        const initialValue =
          field.type === 'Checkbox'
            ? field.default === true || field.default === 'true'
            : field.default ?? '';
        this.form.addControl(
          field.name,
          new FormControl(
            initialValue,
            this.createValidators(field.validations ?? [], field.type)
          ),
        );
      });
    });
  }

  createValidators(validations: FieldValidation[], fieldType?: FieldTypes): ValidatorFn[] {
    const validators: ValidatorFn[] = [];
    validations.forEach((validation) => {
      switch (validation.type) {
        case 'required':
          validators.push(fieldType === 'Checkbox' ? Validators.requiredTrue : Validators.required);
          break;
        case 'email':
          validators.push(Validators.email);
          break;
        case 'minLength':
          validators.push(Validators.minLength(validation.value));
          break;
        case 'maxLength':
          validators.push(Validators.maxLength(validation.value));
          break;
        case 'minValue':
          validators.push(Validators.min(validation.value));
          break;
        case 'maxValue':
          validators.push(Validators.max(validation.value));
          break;
        case 'pattern':
          validators.push(Validators.pattern(validation.value));
          break;
      }
    });
    return validators;
  }

  getControl(fieldName: string): AbstractControl | null {
    return this.form.get(fieldName);
  }

  getInputType(fieldType: FieldTypes): string {
    switch (fieldType) {
      case 'Email':
        return 'email';
      case 'Number':
        return 'number';
      case 'Textbox':
      default:
        return 'text';
    }
  }

  isFieldRequired(field: FormField): boolean {
    return field.validations?.some((v) => v.type === 'required') ?? false;
  }

  resetForm(): void {
    const formDefinition = this.formDefinition();
    if (formDefinition) {
      this.createForm(formDefinition);
    } else {
      this.form.reset();
    }
    this.submitted.set(false);
  }

  submit(): void {
    this.form.markAllAsTouched();
    if (this.form.invalid) {
      if (typeof document !== 'undefined') {
        const firstInvalid = document.querySelector('.ng-invalid:not(form)');
        if (firstInvalid) {
          if (typeof firstInvalid.scrollIntoView === 'function') {
            firstInvalid.scrollIntoView({ behavior: 'smooth', block: 'center' });
          }
          (firstInvalid as HTMLElement).focus?.();
        }
      }
      return;
    }

    const formDefinition = this.formDefinition();
    if (!formDefinition) return;

    const responses: FormResponse[] = formDefinition.sections
      .flatMap((section) => section.fields)
      .map((field) => ({
        fieldId: field.id,
        value: this.getResponseValue(field),
      }));

    const payload: FormSubmission = {
      formId: formDefinition.id,
      responses: responses,
    };

    if (this.isPreview()) {
      this.submitted.set(true);
      return;
    }

    console.log('Submitted payload:', payload);
    this.mockBackendService.saveSubmission(payload);
    this.submitted.set(true);
  }

  getResponseValue(field: FormField): string | number | boolean | null {
    const value = this.form.get(field.name)?.value;

    if (value === null || value === undefined || value === '' || Number.isNaN(value)) {
      return null;
    }

    switch (field.type) {
      case 'Number':
        return Number(value);

      default:
        return value;
    }
  }
}
