import { Component, effect, inject, signal, untracked } from '@angular/core';
import { FormBuilderState } from '../../../core/services/form-builder-state';
import { FieldOption } from '../../../core/models/field-option';
import { FieldTypes } from '../../../core/models/field-types';
import { FieldValidation } from '../../../core/models/field-validation';
import { PropertyError, PropertyName } from './property-error';
import { FormStatus } from '../../../core/models/form-status';
import { UpperCasePipe, TitleCasePipe } from '@angular/common';
import { FormArray, FormControl, FormGroup, ReactiveFormsModule } from '@angular/forms';
import { requiredTrimmedValidator } from '../../../shared/validators/required-trimmed.validator';
import { identifierValidator } from '../../../shared/validators/identifier.validator';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { debounceTime, pairwise, startWith } from 'rxjs';
import { duplicateFieldNameValidator } from '../../../shared/validators/duplicate-field-name.validator';
import { uniqueOptionValueValidator } from '../../../shared/validators/unique-option-value.validator';
import { defaultValueValidator } from '../../../shared/validators/default-value.validator';
import { futureDateValidator } from '../../../shared/validators/future-date.validator';
import { dateRangeValidator } from '../../../shared/validators/date-range.validator';

@Component({
  imports: [UpperCasePipe, TitleCasePipe, ReactiveFormsModule],
  selector: 'app-properties-panel',
  styleUrl: './properties-panel.component.scss',
  templateUrl: './properties-panel.component.html',
})
export class PropertiesPanelComponent {
  private formBuilderState = inject(FormBuilderState);

  selectedField = this.formBuilderState.selectedField;
  activeTab = this.formBuilderState.activeTab;
  form = this.formBuilderState.form;
  propertyErrors = signal<PropertyError[]>([]);

  readonly statusOptions: FormStatus[] = ['Draft', 'Published', 'Unpublished', 'Archived'];

  readonly categoryOptions = ['General', 'Employee', 'Survey', 'Registration', 'Feedback', 'Other'];

  formForm = new FormGroup(
    {
      name: new FormControl('', {
        nonNullable: true,
        validators: [requiredTrimmedValidator],
      }),
      description: new FormControl('', {
        nonNullable: true,
        validators: [requiredTrimmedValidator],
      }),
      code: new FormControl('', {
        nonNullable: true,
        validators: [requiredTrimmedValidator, identifierValidator],
      }),
      category: new FormControl('', {
        nonNullable: true,
      }),
      status: new FormControl<FormStatus>('Draft', {
        nonNullable: true,
      }),
      startDate: new FormControl('', {
        nonNullable: true,
        validators: [futureDateValidator],
      }),

      endDate: new FormControl('', {
        nonNullable: true,
        validators: [futureDateValidator],
      }),

      allowMultipleSubmissions: new FormControl(false, {
        nonNullable: true,
      }),

      allowSaveAsDraft: new FormControl(false, {
        nonNullable: true,
      }),

      confirmationMessage: new FormControl('', {
        nonNullable: true,
      }),

      submitButtonText: new FormControl('Submit', {
        nonNullable: true,
        validators: [requiredTrimmedValidator],
      }),

      cancelButtonText: new FormControl('Cancel', {
        nonNullable: true,
        validators: [requiredTrimmedValidator],
      }),

      theme: new FormControl('', {
        nonNullable: true,
      }),

      logoUrl: new FormControl('', {
        nonNullable: true,
      }),

      headerText: new FormControl('', {
        nonNullable: true,
        validators: [requiredTrimmedValidator],
      }),

      footerText: new FormControl('', {
        nonNullable: true,
      }),
    },
    {
      validators: [dateRangeValidator],
    },
  );

  formEffectRef = effect(() => {
    const currentForm = this.form();

    if (!currentForm) {
      return;
    }

    this.formForm.patchValue(
      {
        name: currentForm.name,
        description: currentForm.description,
        code: currentForm.code,
        category: currentForm.category,
        status: currentForm.status,
        startDate: currentForm.startDate,
        endDate: currentForm.endDate,
        allowMultipleSubmissions: currentForm.allowMultipleSubmissions,
        allowSaveAsDraft: currentForm.allowSaveAsDraft,
        confirmationMessage: currentForm.confirmationMessage,
        submitButtonText: currentForm.submitButtonText,
        cancelButtonText: currentForm.cancelButtonText,
        theme: currentForm.theme,
        logoUrl: currentForm.logoUrl,
        headerText: currentForm.headerText,
        footerText: currentForm.footerText
      },
      { emitEvent: false },
    );
  });

  formValueChanges = this.formForm.valueChanges
    .pipe(debounceTime(300), takeUntilDestroyed())
    .subscribe((value) => {
      if (this.formForm.invalid) {
        return;
      }
      this.formBuilderState.updateFormMetadata(value);
    });

  sectionForm = new FormGroup({
    title: new FormControl('', {
      nonNullable: true,
      validators: [requiredTrimmedValidator],
    }),
    description: new FormControl('', {
      nonNullable: true,
    }),
    theme: new FormControl('', {
      nonNullable: true,
    }),
    visibility: new FormControl(true, {
      nonNullable: true,
    }),
  });

  sectionEfectRef = effect(() => {
    const currentSection = this.formBuilderState.selectedSection();
    if (!currentSection) {
      return;
    }
    this.sectionForm.patchValue(
      {
        title: currentSection.title,
        description: currentSection.description,
        visibility: currentSection.visibility,
        theme: currentSection.theme,
      },
      { emitEvent: false },
    );
  });

  sectionValueChanges = this.sectionForm.valueChanges
    .pipe(debounceTime(300), takeUntilDestroyed())
    .subscribe((value) => {
      if (this.sectionForm.invalid) {
        return;
      }
      this.formBuilderState.updateSection(value);
    });

  fieldForm = new FormGroup(
    {
      label: new FormControl('', {
        nonNullable: true,
        validators: [requiredTrimmedValidator],
      }),

      name: new FormControl('', {
        nonNullable: true,
        validators: [
          requiredTrimmedValidator,
          identifierValidator,
          duplicateFieldNameValidator(
            () => this.formBuilderState.form()?.sections.flatMap((section) => section.fields) ?? [],
            () => this.selectedField()?.id ?? null,
          ),
        ],
      }),

      visibility: new FormControl(true, {
        nonNullable: true,
      }),

      helperDescription: new FormControl('', {
        nonNullable: true,
      }),

      placeholder: new FormControl('', {
        nonNullable: true,
      }),
      options: new FormArray<FormGroup>([], {
        validators: [uniqueOptionValueValidator],
      }),
      default: new FormControl<string | number | boolean>('', {
        nonNullable: true,
      }),
    },
    {
      validators: [defaultValueValidator(() => this.selectedField()?.validation ?? [])],
    },
  );

  selectedFieldRef = effect(() => {
    const fieldId = this.formBuilderState.selectedFieldId();
    if (fieldId === null) {
      return;
    }

    const currentField = untracked(() => this.formBuilderState.selectedField());
    if (!currentField) {
      return;
    }

    this.fieldForm.patchValue(
      {
        label: currentField.label,
        name: currentField.name,
        helperDescription: currentField.helperDescription,
        placeholder: currentField.placeholder,
        visibility: currentField.visibility,
        default: currentField.default,
      },
      { emitEvent: false },
    );

    const options = this.fieldForm.controls.options;
    options.clear({ emitEvent: false });
    for (const option of currentField.options ?? []) {
      options.push(this.createOptionForm(option), { emitEvent: false });
    }
  });

  fieldValueChange = this.fieldForm.valueChanges
    .pipe(
      debounceTime(300),
      startWith(this.fieldForm.getRawValue()),
      pairwise(),
      takeUntilDestroyed(),
    )
    .subscribe(([previousValue, currentValue]) => {
      if (this.fieldForm.invalid) {
        return;
      }

      const field = this.selectedField();

      if (!field) return;

      let defaultValue = currentValue.default;
      if (field.type === 'Number' && defaultValue !== '') {
        defaultValue = Number(defaultValue);
      }
      const previousOptions = previousValue.options ?? [];
      const currentOptions = currentValue.options ?? [];

      if (field.type === 'Dropdown' || field.type === 'RadioButton') {
        const previousDefault = previousValue.default;

        if (typeof previousDefault === 'string') {
          const previousOption = previousOptions.find((option) => option.value === previousDefault);

          if (previousOption) {
            const currentOption = currentOptions.find((option) => option.id === previousOption.id);

            if (!currentOption) {
              defaultValue = '';
            } else if (currentOption.value !== previousOption.value) {
              defaultValue = currentOption.value;
            }
          }
        }
      }

      const updatedValue = {
        ...currentValue,
        options: currentOptions,
        default: defaultValue,
      };

      this.formBuilderState.updateSelectedField(updatedValue);
    });

  createOptionForm(option: FieldOption): FormGroup {
    return new FormGroup({
      id: new FormControl(option.id, {
        nonNullable: true,
      }),
      label: new FormControl(option.label, {
        nonNullable: true,
        validators: [requiredTrimmedValidator],
      }),
      value: new FormControl(option.value, {
        nonNullable: true,
        validators: [requiredTrimmedValidator],
      }),
    });
  }

  supportsOptions(type: FieldTypes): boolean {
    return type === 'Dropdown' || type === 'RadioButton';
  }

  getPropertyError(property: PropertyName): string | null {
    return this.propertyErrors().find((error) => error.property === property)?.message ?? null;
  }

  setPropertyError(property: PropertyName, message: string): void {
    const errors = this.propertyErrors();

    const newError: PropertyError = {
      property,
      message,
    };

    this.propertyErrors.set([...errors.filter((error) => error.property !== property), newError]);
  }

  clearRangeErrors(type: 'minLength' | 'maxLength' | 'minValue' | 'maxValue'): void {
    const isLength = type === 'minLength' || type === 'maxLength';

    if (isLength) {
      this.clearPropertyError('minLength');
      this.clearPropertyError('maxLength');
    } else {
      this.clearPropertyError('minValue');
      this.clearPropertyError('maxValue');
    }
  }

  clearPropertyError(property: PropertyName): void {
    this.propertyErrors.update((errors) => errors.filter((error) => error.property !== property));
  }

  addFieldOption(): void {
    const options = this.fieldForm.controls.options;
    const optionId = Math.max(...options.controls.map((option) => option.value.id), 0) + 1;
    const newOption: FieldOption = {
      id: optionId,
      label: 'New Option',
      value: `option_${optionId}`,
    };

    options.push(this.createOptionForm(newOption));
  }

  deleteFieldOption(optionId: number): void {
    const options = this.fieldForm.controls.options;
    const index = options.controls.findIndex((option) => option.value.id === optionId);

    if (index === -1) return;

    const option = options.at(index);
    const deletedValue = option.value.value;

    const currentDefault = this.fieldForm.controls.default.value;
    options.removeAt(index);

    if (currentDefault === deletedValue) {
      this.fieldForm.controls.default.setValue('');
    }
  }

  isValidationEnabled(type: 'required' | 'email'): boolean {
    const field = this.selectedField();
    if (!field) return false;
    const validations = field.validation ?? [];
    return validations.some((validation) => validation.type === type);
  }

  toggleValidation(type: 'required' | 'email', event: Event): void {
    const field = this.selectedField();
    if (!field) return;

    const isChecked = (event.target as HTMLInputElement).checked;
    const validations = field.validation ?? [];

    if (!isChecked) {
      this.formBuilderState.updateSelectedField({
        validation: validations.filter((validation) => validation.type !== type),
      });
    } else if (!this.isValidationEnabled(type)) {
      this.formBuilderState.updateSelectedField({
        validation: [...validations, { type }],
      });
    }
    this.fieldForm.updateValueAndValidity();
  }

  getValidationValue(type: 'minLength' | 'maxLength' | 'minValue' | 'maxValue'): number | null {
    const field = this.selectedField();
    if (!field) return null;
    const validations = field.validation ?? [];
    const validation = validations.find((validation) => validation.type === type);
    if (!validation || !this.hasNumericValue(validation)) return null;

    return validation.value;
  }

  updateValidationValue(
    type: 'minLength' | 'maxLength' | 'minValue' | 'maxValue',
    event: Event,
  ): void {
    const field = this.selectedField();
    if (!field) return;
    const validations = field.validation ?? [];
    const inputValue = (event.target as HTMLInputElement).value;
    if (inputValue === '') {
      this.clearRangeErrors(type);
      this.formBuilderState.updateSelectedField({
        validation: validations.filter((validation) => validation.type !== type),
      });
      this.fieldForm.updateValueAndValidity();
      return;
    }
    const value = Number(inputValue);
    const newValidation = {
      type,
      value,
    };
    let isUpdated = false;
    const newValidations = validations.map((validation) => {
      if (validation.type === type) {
        isUpdated = true;
        return newValidation;
      }
      return validation;
    });
    const finalValidations = isUpdated ? newValidations : [...newValidations, newValidation];
    if (!this.validateRange(finalValidations, type)) {
      this.setPropertyError(type, 'Min/Max range is invalid');
      return;
    }
    this.clearRangeErrors(type);

    this.formBuilderState.updateSelectedField({
      validation: finalValidations,
    });

    this.fieldForm.updateValueAndValidity();
  }

  validateRange(
    validations: FieldValidation[],
    type: 'minLength' | 'maxLength' | 'minValue' | 'maxValue',
  ): boolean {
    const isLength = type === 'minLength' || type === 'maxLength';

    const minType = isLength ? 'minLength' : 'minValue';
    const maxType = isLength ? 'maxLength' : 'maxValue';

    const min = validations.find((validation) => validation.type === minType);

    const max = validations.find((validation) => validation.type === maxType);

    if (!min || !max || !this.hasNumericValue(min) || !this.hasNumericValue(max)) return true;

    return min.value <= max.value;
  }

  private hasNumericValue(
    validation: FieldValidation,
  ): validation is Extract<
    FieldValidation,
    { type: 'minLength' | 'maxLength' | 'minValue' | 'maxValue' }
  > {
    return (
      validation.type === 'minLength' ||
      validation.type === 'maxLength' ||
      validation.type === 'minValue' ||
      validation.type === 'maxValue'
    );
  }

  getPatternValidationValue(): string | null {
    const field = this.selectedField();
    if (!field) return null;
    const validations = field.validation ?? [];
    const validation = validations.find((validation) => validation.type === 'pattern');
    if (!validation || validation.type !== 'pattern') return null;

    return validation.value;
  }

  updatePatternValidation(event: Event): void {
    const field = this.selectedField();
    if (!field) return;
    const validations = field.validation ?? [];
    const value = (event.target as HTMLInputElement).value;
    this.clearPropertyError('pattern');

    if (value === '') {
      this.formBuilderState.updateSelectedField({
        validation: validations.filter((validation) => validation.type !== 'pattern'),
      });
      return;
    }
    if (!this.isValidPattern(value)) {
      this.setPropertyError('pattern', 'Invalid regular expression');
      return;
    }

    const newValidation = {
      type: 'pattern' as const,
      value,
    };
    let isUpdated = false;
    const newValidations = validations.map((validation) => {
      if (validation.type === 'pattern') {
        isUpdated = true;
        return newValidation;
      }
      return validation;
    });
    const finalValidations = isUpdated ? newValidations : [...newValidations, newValidation];

    this.formBuilderState.updateSelectedField({
      validation: finalValidations,
    });
  }

  isValidPattern(pattern: string): boolean {
    try {
      new RegExp(pattern);
      return true;
    } catch {
      return false;
    }
  }
}
