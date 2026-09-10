import { Component, inject, signal } from '@angular/core';
import { FormBuilderState } from '../../../core/services/form-builder-state';
import { FormField } from '../../../core/models/form-field';
import { FieldOption } from '../../../core/models/field-option';
import { FieldTypes } from '../../../core/models/field-types';
import { FieldValidation } from '../../../core/models/field-validation';
import { PropertyError, PropertyName } from './property-error';

@Component({
  imports: [],
  selector: 'app-properties-panel',
  styleUrl: './properties-panel.component.scss',
  templateUrl: './properties-panel.component.html',
})
export class PropertiesPanelComponent {
  private formBuilderState = inject(FormBuilderState);

  selectedField = this.formBuilderState.selectedField;
  propertyErrors = signal<PropertyError[]>([]);

  updateFieldProperty<K extends keyof FormField>(property: K, event: Event): void {
    const input = event.target as HTMLInputElement;

    let value: string | number | boolean;

    if (input.type === 'checkbox') {
      value = input.checked;
    } else if (input.type === 'number') {
      value = input.value === '' ? '' : Number(input.value);
    } else {
      value = input.value;
    }
    this.formBuilderState.updateSelectedField({
      [property]: value,
    });
  }

  supportsOptions(type: FieldTypes): boolean {
    return type === 'Dropdown' || type === 'RadioButton' || type === 'Checkbox';
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

  clearPropertyError(property: PropertyName): void {
    this.propertyErrors.update((errors) => errors.filter((error) => error.property !== property));
  }

  addOption(): void {
    const field = this.selectedField();
    if (!field) return;

    const options = field.options ?? [];
    const optionId = Math.max(...options.map((option) => option.id), 0) + 1;
    const newOption: FieldOption = {
      id: optionId,
      label: 'New Option',
      value: 'new-option',
    };

    this.formBuilderState.updateSelectedField({
      options: [...options, newOption],
    });
  }

  updateOption(optionId: number, property: 'label' | 'value', event: Event): void {
    const field = this.selectedField();

    if (!field) return;

    let updates: Partial<FormField> = {};
    const options = field.options ?? [];
    const value = (event.target as HTMLInputElement).value;
    const duplicate = options.some((option) => option.id !== optionId && option.value === value);
    if (property === 'value' && duplicate) return;

    const newOptions = options.map((option) => {
      if (option.id === optionId) {
        if (property === 'value' && option.value === field.default) {
          updates = { default: value };
        }
        return {
          ...option,
          [property]: value,
        };
      }
      return option;
    });

    this.formBuilderState.updateSelectedField({
      options: newOptions,
      ...updates,
    });
  }

  deleteOption(optionId: number): void {
    const field = this.selectedField();

    if (!field) return;
    const options = field.options ?? [];
    const option = options.find((option) => option.id === optionId);

    const newOptions = options.filter((option) => option.id !== optionId);

    const updates: Partial<FormField> = {
      options: newOptions,
    };

    if (option?.value === field.default) {
      updates.default = '';
    }

    this.formBuilderState.updateSelectedField(updates);
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
      this.formBuilderState.updateSelectedField({
        validation: validations.filter((validation) => validation.type !== type),
      });
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
      console.log(type);
      this.setPropertyError(type, 'Min/Max range is invalid');
      return;
    }
    this.clearPropertyError(type);

    this.formBuilderState.updateSelectedField({
      validation: finalValidations,
    });
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
