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


export function cleanValueQuotes(val: any): any {
  if (val === null || val === undefined) return null;
  if (typeof val !== 'string') return val;

  let s = val.trim();
  let changed = true;

  while (changed && s.length > 0) {
    changed = false;

    // 1. Strip unicode escapes for quotes: \u0022, \\u0022, \\\u0022
    if (s.toLowerCase().startsWith('\\\\\\u0022')) {
      s = s.substring(8).trim();
      changed = true;
    } else if (s.toLowerCase().startsWith('\\\\u0022')) {
      s = s.substring(7).trim();
      changed = true;
    } else if (s.toLowerCase().startsWith('\\u0022')) {
      s = s.substring(6).trim();
      changed = true;
    }

    if (s.toLowerCase().endsWith('\\\\\\u0022')) {
      s = s.substring(0, s.length - 8).trim();
      changed = true;
    } else if (s.toLowerCase().endsWith('\\\\u0022')) {
      s = s.substring(0, s.length - 7).trim();
      changed = true;
    } else if (s.toLowerCase().endsWith('\\u0022')) {
      s = s.substring(0, s.length - 6).trim();
      changed = true;
    }

    // 2. Strip escaped quotes: \" or \\"
    if (s.startsWith('\\\\"')) {
      s = s.substring(3).trim();
      changed = true;
    } else if (s.startsWith('\\"')) {
      s = s.substring(2).trim();
      changed = true;
    }

    if (s.endsWith('\\\\"')) {
      s = s.substring(0, s.length - 3).trim();
      changed = true;
    } else if (s.endsWith('\\"')) {
      s = s.substring(0, s.length - 2).trim();
      changed = true;
    }

    // 3. Strip standard quotes: " or '
    if (s.length >= 2 && ((s.startsWith('"') && s.endsWith('"')) || (s.startsWith("'") && s.endsWith("'")))) {
      s = s.substring(1, s.length - 1).trim();
      changed = true;
    }
  }

  // If only quote markers or escape markers remain, treat as null
  const lower = s.toLowerCase();
  if (
    lower === '\\u0022' ||
    lower === '\\\\u0022' ||
    lower === '\\"' ||
    s === '"' ||
    s === "'" ||
    s.length === 0
  ) {
    return null;
  }

  return s;
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
      const cleanDefault = cleanValueQuotes(field.default);

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
        default: cleanDefault,
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

          cleanField.default = cleanValueQuotes(cleanField.default);

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

  return cloned as FormDefinition;
}
