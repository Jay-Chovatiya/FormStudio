import { FormDefinition } from '../models/form-definition';
import { FormSection } from '../models/form-section';
import { FormField } from '../models/form-field';
import { FieldOption } from '../models/field-option';
import { FieldValidation } from '../models/field-validation';

/**
 * Generates a standard UUID v4 string.
 */
export function generateGuid(): string {
  if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') {
    return crypto.randomUUID();
  }
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
    const r = (Math.random() * 16) | 0;
    const v = c === 'x' ? r : (r & 0x3) | 0x8;
    return v.toString(16);
  });
}

/**
 * Normalizes a form definition ensuring every section, field, and option
 * has a unique GUID. For existing elements where GUID is not present,
 * uses the existing element ID as fallback.
 */
export function normalizeFormGuids(form: FormDefinition): FormDefinition {
  if (!form) return form;

  const clonedForm: FormDefinition = structuredClone(form);

  clonedForm.sections = (clonedForm.sections || []).map((section: FormSection) => {
    const sectionGuid = section.guid || (section.id !== undefined && section.id !== null ? String(section.id) : generateGuid());

    const fields = (section.fields || []).map((field: FormField) => {
      const fieldGuid = field.guid || (field.id !== undefined && field.id !== null ? String(field.id) : generateGuid());

      const options = field.options?.map((option: FieldOption) => ({
        ...option,
        guid: option.guid || (option.id !== undefined && option.id !== null ? String(option.id) : generateGuid()),
      }));

      return {
        ...field,
        guid: fieldGuid,
        options,
        validations: field.validations ? structuredClone(field.validations) : [],
      };
    });

    return {
      ...section,
      guid: sectionGuid,
      fields,
    };
  });

  return clonedForm;
}

/**
 * Recursively strips GUIDs from a form definition before sending the payload to the backend API.
 */
export function stripGuidsFromForm(form: FormDefinition): FormDefinition {
  if (!form) return form;

  const cloned: any = structuredClone(form);

  if (Array.isArray(cloned.sections)) {
    cloned.sections = cloned.sections.map((sec: any) => {
      const { guid: _secGuid, ...cleanSec } = sec;
      if (Array.isArray(cleanSec.fields)) {
        cleanSec.fields = cleanSec.fields.map((field: any) => {
          const { guid: _fieldGuid, ...cleanField } = field;
          if (Array.isArray(cleanField.options)) {
            cleanField.options = cleanField.options.map((opt: any) => {
              const { guid: _optGuid, ...cleanOpt } = opt;
              return cleanOpt;
            });
          }
          return cleanField;
        });
      }
      return cleanSec;
    });
  }

  return cloned as FormDefinition;
}
