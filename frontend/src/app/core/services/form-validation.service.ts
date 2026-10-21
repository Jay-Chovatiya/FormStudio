import { Service } from '@angular/core';
import { AbstractControl } from '@angular/forms';
import { FormDefinition } from '../models/form-definition';
import { requiredTrimmedValidator } from '../../shared/validators/required-trimmed.validator';
import { identifierValidator } from '../../shared/validators/identifier.validator';

export interface FormValidationError {
  message: string;
  target: 'form' | 'section' | 'field';
  sectionId?: string | number;
  fieldId?: string | number;
}

@Service()
export class FormValidationService {
  
  validateForm(form: FormDefinition): FormValidationError | null {
    
    const metadataError = this.validateMetadata(form);
    if (metadataError) {
      return metadataError;
    }

    if (form.sections && form.sections.length > 0) {
      const sectionError = this.validateSections(form);
      if (sectionError) {
        return sectionError;
      }
    }

    return null;
  }

  private validateMetadata(form: FormDefinition): FormValidationError | null {
    if (this.hasError(requiredTrimmedValidator, form.name)) {
      return { target: 'form', message: 'Form name is required.' };
    }

    if (this.hasError(requiredTrimmedValidator, form.description)) {
      return { target: 'form', message: 'Form description is required.' };
    }

    if (this.hasError(requiredTrimmedValidator, form.code)) {
      return { target: 'form', message: 'Form code is required.' };
    }

    if (this.hasError(identifierValidator, form.code)) {
      return {
        target: 'form',
        message: 'Form code must be a valid identifier (starts with letter, alphanumeric and underscores only).',
      };
    }

    if (form.startDate && form.endDate && new Date(form.endDate) <= new Date(form.startDate)) {
      return { target: 'form', message: 'End date must be after start date.' };
    }

    if (this.hasError(requiredTrimmedValidator, form.submitButtonText)) {
      return { target: 'form', message: 'Submit button text is required.' };
    }

    if (this.hasError(requiredTrimmedValidator, form.cancelButtonText)) {
      return { target: 'form', message: 'Cancel button text is required.' };
    }

    return null;
  }

  private validateSections(form: FormDefinition): FormValidationError | null {
    const sectionTitles = new Set<string>();
    const fieldNames = new Set<string>();

    for (const section of form.sections) {
      const sectionId = section.guid ?? section.id;

      if (this.hasError(requiredTrimmedValidator, section.title)) {
        return { target: 'section', sectionId, message: 'Section title is required.' };
      }

      const normalizedTitle = (section.title || '').trim().toLowerCase();
      if (sectionTitles.has(normalizedTitle)) {
        return {
          target: 'section',
          sectionId,
          message: `Section title '${section.title}' must be unique.`,
        };
      }
      sectionTitles.add(normalizedTitle);

      for (const field of section.fields ?? []) {
        const fieldId = field.guid ?? field.id;

        if (this.hasError(requiredTrimmedValidator, field.label)) {
          return {
            target: 'field',
            sectionId,
            fieldId,
            message: `Field label is required for '${field.name || 'field'}'.`,
          };
        }

        if (this.hasError(requiredTrimmedValidator, field.name)) {
          return { target: 'field', sectionId, fieldId, message: 'Field name is required.' };
        }

        if (this.hasError(identifierValidator, field.name)) {
          return {
            target: 'field',
            sectionId,
            fieldId,
            message: `Field name '${field.name}' is invalid. It must start with a letter and contain only alphanumeric characters and underscores.`,
          };
        }

        const normalizedFieldName = (field.name || '').trim().toLowerCase();
        if (fieldNames.has(normalizedFieldName)) {
          return {
            target: 'field',
            sectionId,
            fieldId,
            message: `Field name '${field.name}' already exists. Field names must be unique across the form.`,
          };
        }
        fieldNames.add(normalizedFieldName);

        if (field.type === 'File') {
          if (!field.allowedTypes || field.allowedTypes.length === 0) {
            const fieldLabel = field.label?.trim() || field.name?.trim() || 'File';
            return {
              target: 'field',
              sectionId,
              fieldId,
              message: `Please select at least one allowed file type for field '${fieldLabel}'.`,
            };
          }
        }

        if (field.options && field.options.length > 0) {
          const optionValues = new Set<string>();
          for (const option of field.options) {
            const val = (option.value || '').trim();
            if (!val) {
              return {
                target: 'field',
                sectionId,
                fieldId,
                message: `Option value is required for field '${field.label || field.name}'.`,
              };
            }

            const normalizedVal = val.toLowerCase();
            if (optionValues.has(normalizedVal)) {
              return {
                target: 'field',
                sectionId,
                fieldId,
                message: `Option values must be unique for field '${field.label || field.name}'.`,
              };
            }
            optionValues.add(normalizedVal);
          }
        }
      }
    }

    return null;
  }

  private hasError(
    validator: (control: AbstractControl) => Record<string, any> | null,
    value: unknown,
  ): boolean {
    return validator({ value } as AbstractControl) !== null;
  }
}
