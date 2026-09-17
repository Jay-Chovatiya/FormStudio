import { Component, input } from '@angular/core';
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

@Component({
  imports: [ReactiveFormsModule],
  selector: 'app-dynamic-form',
  styleUrl: './dynamic-form.component.scss',
  templateUrl: './dynamic-form.component.html',
})
export class DynamicFormComponent {
  readonly formDefinition = input<FormDefinition | null>(null);

  form = new FormGroup({});

  ngOnInit(): void {
    const formDefinition = this.formDefinition();

    if (!formDefinition) return;

    this.createForm(formDefinition);
  }

  createForm(formDefinition: FormDefinition) {
    formDefinition.sections.forEach((section) => {
      section.fields.forEach((field) => {
        this.form.addControl(
          field.name,
          new FormControl(field.default ?? '', this.createValidators(field.validation ?? [])),
        );
      });
    });
  }

  createValidators(validations: FieldValidation[]): ValidatorFn[] {
    const validators: ValidatorFn[] = [];
    validations.forEach((validation) => {
      switch (validation.type) {
        case 'required':
          validators.push(Validators.required);
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
      case 'Textbox':
        return 'text';
      case 'Email':
        return 'email';
      case 'Number':
        return 'number';
      case 'Date':
        return 'date';
      case 'DateTime':
        return 'datetime-local';
      default:
        return 'text';
    }
  }

  isFieldRequired(field: FormField): boolean {
    return field.validation?.some((v) => v.type === 'required') ?? false;
  }

  submit() {
    this.form.markAllAsTouched();
    if (this.form.invalid) return;

    const formDefinition = this.formDefinition();

    if (!formDefinition) return;

    const responses: FormResponse[] = formDefinition.sections
      .flatMap((section) => section.fields)
      .map((field) => ({
        fieldId: field.id,
        value: this.getResponseValue(field),
      }));

    const payload: FormSubmission = {
      formId: 10,
      responses: responses,
    };

    console.log('Submitted payload:', payload);
  }

  getResponseValue(field: FormField): string | number | boolean | null {
    const value = this.form.get(field.name)?.value;

    if (value === null || value === undefined || value === '') {
      return '';
    }

    switch (field.type) {
      case 'Number':
        return Number(value);

      default:
        return value;
    }
  }
}
