import { AbstractControl, FormArray, FormGroup, ValidationErrors, ValidatorFn } from '@angular/forms';

export interface UniqueValueValidatorConfig<T = unknown> {
  property?: string;
  selector?: (item: T | AbstractControl) => unknown;
  getItems?: () => (T | AbstractControl)[];
  caseSensitive?: boolean;
  trim?: boolean;
  ignoreEmpty?: boolean;
  normalize?: (value: unknown) => unknown;
  errorKey?: string;
}

export function uniqueValueValidator<T = unknown>(
  configOrProperty?: string | UniqueValueValidatorConfig<T>,
): ValidatorFn {
  const config: UniqueValueValidatorConfig<T> =
    typeof configOrProperty === 'string'
      ? { property: configOrProperty }
      : configOrProperty ?? {};

  const {
    property = 'value',
    selector,
    getItems,
    caseSensitive = true,
    trim = true,
    ignoreEmpty = true,
    normalize,
    errorKey = 'duplicateValue',
  } = config;

  const extractRawValue = (item: unknown): unknown => {
    if (selector) {
      return selector(item as T | AbstractControl);
    }

    if (item instanceof FormGroup) {
      return property ? item.get(property)?.value : item.value;
    }

    if (item instanceof AbstractControl) {
      if (property && item.value && typeof item.value === 'object') {
        return (item.value as Record<string, unknown>)[property];
      }
      return item.value;
    }

    if (property && item && typeof item === 'object') {
      return (item as Record<string, unknown>)[property];
    }

    return item;
  };

  const normalizeValue = (raw: unknown): unknown => {
    let value = raw;

    if (typeof value === 'string') {
      if (trim) {
        value = value.trim();
      }
      if (!caseSensitive) {
        value = (value as string).toLowerCase();
      }
    }

    if (normalize) {
      value = normalize(value);
    }

    return value;
  };

  const isEmpty = (value: unknown): boolean => {
    return value === null || value === undefined || (typeof value === 'string' && value === '');
  };

  const createError = (duplicateVal?: unknown): ValidationErrors => {
    return {
      [errorKey]: true,
      value: duplicateVal,
    };
  };

  return (control: AbstractControl): ValidationErrors | null => {
    // Validating items within a FormArray
    if (control instanceof FormArray) {
      const seen = new Set<unknown>();

      for (const childControl of control.controls) {
        const raw = extractRawValue(childControl);
        if (ignoreEmpty && isEmpty(raw)) {
          continue;
        }

        const normalized = normalizeValue(raw);
        if (ignoreEmpty && isEmpty(normalized)) {
          continue;
        }

        if (seen.has(normalized)) {
          return createError(raw);
        }

        seen.add(normalized);
      }

      return null;
    }

    // Validating an individual FormControl against getItems()
    if (getItems) {
      const rawControlValue = extractRawValue(control);
      if (ignoreEmpty && isEmpty(rawControlValue)) {
        return null;
      }

      const normalizedControlValue = normalizeValue(rawControlValue);
      if (ignoreEmpty && isEmpty(normalizedControlValue)) {
        return null;
      }

      const items = getItems() ?? [];
      const hasDuplicate = items.some((item) => {
        if (item === control) {
          return false;
        }

        const rawItemValue = extractRawValue(item);
        if (ignoreEmpty && isEmpty(rawItemValue)) {
          return false;
        }

        const normalizedItemValue = normalizeValue(rawItemValue);
        return normalizedItemValue === normalizedControlValue;
      });

      return hasDuplicate ? createError(rawControlValue) : null;
    }

    return null;
  };
}
