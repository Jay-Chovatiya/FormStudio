import { FormDefinition } from '../models/form-definition';
import { FormSection } from '../models/form-section';
import { FormField } from '../models/form-field';
import { FieldOption } from '../models/field-option';

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

export function normalizeFormGuids(form: FormDefinition): FormDefinition {
  if (!form) return form;
  const clonedForm: FormDefinition = structuredClone(form);

  const rawSections = clonedForm.sections || [];
  // Sort sections by displayOrder if available
  rawSections.sort((a, b) => (a.displayOrder ?? 0) - (b.displayOrder ?? 0));

  clonedForm.sections = rawSections.map((section: FormSection, sIdx: number) => {
    const sectionGuid = section.guid || (section.id !== undefined && section.id !== null ? String(section.id) : generateGuid());

    const rawFields = section.fields || [];
    rawFields.sort((a, b) => (a.displayOrder ?? 0) - (b.displayOrder ?? 0));

    const fields = rawFields.map((field: FormField, fIdx: number) => {
      const fieldGuid = field.guid || (field.id !== undefined && field.id !== null ? String(field.id) : generateGuid());
      const defaultValue = field.default !== undefined && field.default !== null && field.default !== ''
        ? String(field.default)
        : null;

      const rawOptions = field.options ? [...field.options] : [];
      rawOptions.sort((a, b) => (a.displayOrder ?? 0) - (b.displayOrder ?? 0));

      const options = rawOptions.map((option: FieldOption, oIdx: number) => ({
        ...option,
        displayOrder: option.displayOrder ?? oIdx,
        guid: option.guid || (option.id !== undefined && option.id !== null ? String(option.id) : generateGuid()),
      }));

      return {
        ...field,
        guid: fieldGuid,
        default: defaultValue,
        displayOrder: field.displayOrder ?? fIdx,
        options,
        validations: field.validations ? structuredClone(field.validations) : [],
      };
    });

    return {
      ...section,
      guid: sectionGuid,
      displayOrder: section.displayOrder ?? sIdx,
      fields,
    };
  });

  return clonedForm;
}

export function stripGuidsFromForm(form: FormDefinition): FormDefinition {
  if (!form) return form;

  const cloned: any = structuredClone(form);

  if (typeof cloned.startDate === 'string' && cloned.startDate.trim() === '') {
    cloned.startDate = null;
  }
  if (typeof cloned.endDate === 'string' && cloned.endDate.trim() === '') {
    cloned.endDate = null;
  }

  if (Array.isArray(cloned.sections)) {
    cloned.sections = cloned.sections.map((sec: any, secIndex: number) => {
      const { guid: _secGuid, ...cleanSec } = sec;
      cleanSec.displayOrder = secIndex;

      if (Array.isArray(cleanSec.fields)) {
        cleanSec.fields = cleanSec.fields.map((field: any, fieldIndex: number) => {
          const { guid: _fieldGuid, ...cleanField } = field;
          cleanField.displayOrder = fieldIndex;

          cleanField.default = cleanField.default !== undefined && cleanField.default !== null && String(cleanField.default).trim() !== ''
            ? String(cleanField.default)
            : null;

          if (Array.isArray(cleanField.options)) {
            cleanField.options = cleanField.options.map((opt: any, optIndex: number) => {
              const { guid: _optGuid, ...cleanOpt } = opt;
              cleanOpt.displayOrder = optIndex;
              return cleanOpt;
            });
          }
          return cleanField;
        });
      }
      return cleanSec;
    });
  }

  return cloned;
}
