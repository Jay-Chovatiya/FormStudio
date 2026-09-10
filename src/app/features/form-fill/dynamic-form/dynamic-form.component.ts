import { Component} from '@angular/core';
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

@Component({
  imports: [ReactiveFormsModule],
  selector: 'app-dynamic-form',
  styleUrl: './dynamic-form.component.scss',
  templateUrl: './dynamic-form.component.html',
})
export class DynamicFormComponent {
  fields: FormField[] = [
    {
      id: 1,
      label: 'User Name',
      name: 'name',
      type: 'Textbox',
      visibility: true,
      default: 'Jay',
      validation: [{ type: 'required' }, { type: 'minLength', value: 3 }],
    },
    {
      id: 2,
      label: 'Email',
      name: 'email',
      type: 'Email',
      visibility: true,
      default: 'cah@dfd',
      placeholder: 'Enter your email',
      validation: [{ type: 'required' }, { type: 'email' }],
    },
    {
      id: 3,
      label: 'Mobile Number',
      name: 'mobileNumber',
      type: 'Number',
      visibility: true,
      placeholder: '0123456789',
      default: '4564561230',
      validation: [
        { type: 'required' },
        { type: 'maxLength', value: 10 },
        { type: 'minLength', value: 10 },
      ],
    },
    {
      id: 4,
      name: 'gender',
      label: 'Gender',
      type: 'Dropdown',
      visibility: true,
      options: [
        { id: 1,label: 'Male', value: 'M' },
        { id: 2,label: 'Female', value: 'F' },
        { id: 3,label: 'Other', value: 'O' },
      ],
    },
    {
      id: 5,
      name: 'agreeTerms',
      label: 'Accept Terms',
      type: 'Checkbox',
      visibility: true,
      default: false,
    },
    {
      id: 6,
      name: 'genderRadio',
      label: 'Gender',
      type: 'RadioButton',
      visibility: true,
      options: [
        { id: 1, label: 'Male', value: 'M' },
        { id: 2, label: 'Female', value: 'F' },
        { id: 3, label: 'Other', value: 'O' },
      ],
    },
  ];

  form = new FormGroup({});
  createForm(fields: FormField[]) {
    fields.forEach((field) => {
      console.log(field.name + ' : ' + field.default);
      this.form.addControl(
        field.name,
        new FormControl(field.default ?? '', this.createValidators(field.validation ?? [])),
      );
    });

    console.log(this.form.controls);
    console.log(this.form.value);
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

  ngOnInit(): void {
    this.createForm(this.fields);
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
      default:
        return 'text';
    }
  }

  submit() {
    this.form.markAllAsTouched();
    console.log('validation ', this.form.valid);
    if (this.form.invalid) {
      return;
    }

    const responses: FormResponse[] = this.fields.map((field) => ({
      fieldId: field.id,
      value: this.form.get(field.name)?.value,
    }));

    const payload: FormSubmission = {
      formId: 10,
      responses: responses,
    };

    console.log(payload);

    console.log(this.form.value);
  }
}
