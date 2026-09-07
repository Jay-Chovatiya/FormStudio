import { Component, OnInit } from '@angular/core';
import { FormField } from '../../../core/models/form-field';
import { FormGroup, FormControl, ReactiveFormsModule, Validators, ValidatorFn } from '@angular/forms';
import { FieldValidation } from '../../../core/models/field-validation';

@Component({
  imports: [ReactiveFormsModule],
  selector: 'app-dynamic-form',
  styleUrl: './dynamic-form.scss',
  templateUrl: './dynamic-form.html',
})
export class DynamicForm implements OnInit {

  fields: FormField[] = [
    {
      id: 1,
      label: "User Name",
      name: "name",
      type: 'Textbox',
      visibility: true,
      // default: 'Jay',
      validation: [
        { type: 'required' },
        { type: 'minLength', value: 3 }
      ]
    },
    {
      id: 2,
      label: "User Email",
      name: "email",
      type: 'Email',
      visibility: true,
      placeholder: "Enter your email"
    },
  ];

  form = new FormGroup({});
  createForm(fields: FormField[]) {
    fields.forEach(field => {
      console.log(field.name + ' : ' + field.default);
      this.form.addControl(field.name, new FormControl(field.default ?? '', this.createValidators(field.validation ?? [])));
    })

    console.log(this.form.controls);
    console.log(this.form.value);
  }

  createValidators(validations: FieldValidation[]): ValidatorFn[] {
    const validators: ValidatorFn[] = [];
    validations.forEach(validation => {
      switch (validation.type) {
        case 'required':
          validators.push(Validators.required);
          break;
        case 'email':
          validators.push(Validators.email);
          break;
        case 'minLength':
          validators.push(Validators.minLength(validation.value as number));
          break;
        case 'maxLength':
          validators.push(Validators.maxLength(validation.value as number));
          break;
        case 'minValue':
          validators.push(Validators.min(validation.value as number));
          break;
        case 'maxValue':
          validators.push(Validators.max(validation.value as number));
          break;
        case 'pattern':
          validators.push(Validators.pattern(validation.value as string));
          break;
      }
    });
    return validators;
  }

  ngOnInit(): void {
    this.createForm(this.fields);
  }

  submit() {
    this.form.markAllAsTouched();
    console.log('validation ',this.form.valid);
    if (this.form.invalid) {
      return;
    }

    console.log(this.form.value);
  }


}
