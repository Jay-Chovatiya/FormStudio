import { FormArray, FormControl, FormGroup } from '@angular/forms';
import { describe, expect, it } from 'vitest';
import { uniqueValueValidator } from './unique-value.validator';

describe('uniqueValueValidator', () => {
  describe('FormArray validation', () => {
    it('should return null when FormArray is empty', () => {
      const validator = uniqueValueValidator({ property: 'value' });
      const formArray = new FormArray<FormGroup>([]);

      expect(validator(formArray)).toBeNull();
    });

    it('should return null when all property values are unique', () => {
      const validator = uniqueValueValidator({ property: 'value' });
      const formArray = new FormArray([
        new FormGroup({ value: new FormControl('option_1') }),
        new FormGroup({ value: new FormControl('option_2') }),
        new FormGroup({ value: new FormControl('option_3') }),
      ]);

      expect(validator(formArray)).toBeNull();
    });

    it('should return duplicate error when duplicate values exist in FormArray', () => {
      const validator = uniqueValueValidator({
        property: 'value',
        errorKey: 'duplicateOptionValue',
      });
      const formArray = new FormArray([
        new FormGroup({ value: new FormControl('option_1') }),
        new FormGroup({ value: new FormControl('option_1') }),
      ]);

      const errors = validator(formArray);
      expect(errors).toEqual({
        duplicateOptionValue: true,
        value: 'option_1',
      });
    });

    it('should support string shorthand for property name', () => {
      const validator = uniqueValueValidator('value');
      const formArray = new FormArray([
        new FormGroup({ value: new FormControl('apple') }),
        new FormGroup({ value: new FormControl('apple') }),
      ]);

      expect(validator(formArray)).toEqual({
        duplicateValue: true,
        value: 'apple',
      });
    });

    it('should ignore empty string and null values when ignoreEmpty is true', () => {
      const validator = uniqueValueValidator({ property: 'value', ignoreEmpty: true });
      const formArray = new FormArray([
        new FormGroup({ value: new FormControl('') }),
        new FormGroup({ value: new FormControl('') }),
        new FormGroup({ value: new FormControl(null) }),
        new FormGroup({ value: new FormControl('unique_val') }),
      ]);

      expect(validator(formArray)).toBeNull();
    });

    it('should trim string values before comparison when trim is true', () => {
      const validator = uniqueValueValidator({ property: 'value', trim: true });
      const formArray = new FormArray([
        new FormGroup({ value: new FormControl('val') }),
        new FormGroup({ value: new FormControl('  val  ') }),
      ]);

      expect(validator(formArray)).toEqual({
        duplicateValue: true,
        value: '  val  ',
      });
    });

    it('should respect caseSensitive option', () => {
      const caseSensitiveValidator = uniqueValueValidator({
        property: 'value',
        caseSensitive: true,
      });
      const formArray = new FormArray([
        new FormGroup({ value: new FormControl('test') }),
        new FormGroup({ value: new FormControl('TEST') }),
      ]);

      expect(caseSensitiveValidator(formArray)).toBeNull();

      const caseInsensitiveValidator = uniqueValueValidator({
        property: 'value',
        caseSensitive: false,
      });

      expect(caseInsensitiveValidator(formArray)).toEqual({
        duplicateValue: true,
        value: 'TEST',
      });
    });

    it('should support custom normalizer function (e.g., file extensions)', () => {
      const extensionNormalizer = (val: unknown) =>
        typeof val === 'string'
          ? val.trim().toLowerCase().startsWith('.')
            ? val.trim().toLowerCase()
            : '.' + val.trim().toLowerCase()
          : val;

      const validator = uniqueValueValidator({
        property: 'extension',
        errorKey: 'duplicateExtension',
        normalize: extensionNormalizer,
      });

      const formArray = new FormArray([
        new FormGroup({ extension: new FormControl('.png') }),
        new FormGroup({ extension: new FormControl('PNG') }),
      ]);

      expect(validator(formArray)).toEqual({
        duplicateExtension: true,
        value: 'PNG',
      });
    });

    it('should validate FormArray of primitive FormControls when no property is provided', () => {
      const validator = uniqueValueValidator();
      const formArray = new FormArray([
        new FormControl('first'),
        new FormControl('second'),
        new FormControl('first'),
      ]);

      expect(validator(formArray)).toEqual({
        duplicateValue: true,
        value: 'first',
      });
    });

    it('should support custom selector function', () => {
      const validator = uniqueValueValidator({
        selector: (c) => (c as FormGroup).get('nested')?.value?.name,
      });
      const formArray = new FormArray([
        new FormGroup({ nested: new FormControl({ name: 'A' }) }),
        new FormGroup({ nested: new FormControl({ name: 'A' }) }),
      ]);

      expect(validator(formArray)).toEqual({
        duplicateValue: true,
        value: 'A',
      });
    });
  });

  describe('Single FormControl validation with getItems', () => {
    it('should return null when control value is not present in getItems', () => {
      const allowedTypes = [
        new FormGroup({ extension: new FormControl('.pdf') }),
        new FormGroup({ extension: new FormControl('.docx') }),
      ];

      const validator = uniqueValueValidator({
        getItems: () => allowedTypes,
        property: 'extension',
        errorKey: 'duplicateExtension',
        caseSensitive: false,
      });

      const control = new FormControl('.png');
      expect(validator(control)).toBeNull();
    });

    it('should return error when control value is present in getItems', () => {
      const normalizeExt = (ext: unknown) =>
        typeof ext === 'string'
          ? ext.trim().toLowerCase().startsWith('.')
            ? ext.trim().toLowerCase()
            : '.' + ext.trim().toLowerCase()
          : ext;

      const allowedTypes = [
        new FormGroup({ extension: new FormControl('.pdf') }),
        new FormGroup({ extension: new FormControl('.png') }),
      ];

      const validator = uniqueValueValidator({
        getItems: () => allowedTypes,
        property: 'extension',
        errorKey: 'duplicateExtension',
        caseSensitive: false,
        normalize: normalizeExt,
      });

      const control = new FormControl('PNG');
      expect(validator(control)).toEqual({
        duplicateExtension: true,
        value: 'PNG',
      });
    });

    it('should not mark duplicate against self when control is inside getItems', () => {
      const control = new FormControl('custom_ext');
      const items = [control];

      const validator = uniqueValueValidator({
        getItems: () => items,
      });

      expect(validator(control)).toBeNull();
    });

    it('should return null when single control is empty and ignoreEmpty is true', () => {
      const items = ['a', 'b', 'c'];
      const validator = uniqueValueValidator({
        getItems: () => items,
        ignoreEmpty: true,
      });

      const control = new FormControl('');
      expect(validator(control)).toBeNull();
    });

    it('should return error when duplicate mimeType exists in FormArray', () => {
      const validator = uniqueValueValidator({
        property: 'mimeType',
        errorKey: 'duplicateMimeType',
        caseSensitive: false,
        trim: true,
      });

      const formArray = new FormArray([
        new FormGroup({ mimeType: new FormControl('application/pdf') }),
        new FormGroup({ mimeType: new FormControl('APPLICATION/PDF ') }),
      ]);

      expect(validator(formArray)).toEqual({
        duplicateMimeType: true,
        value: 'APPLICATION/PDF ',
      });
    });

    it('should validate mimeType uniqueness on single control using getItems', () => {
      const allowedTypes = [
        new FormGroup({ mimeType: new FormControl('image/png') }),
        new FormGroup({ mimeType: new FormControl('application/pdf') }),
      ];

      const validator = uniqueValueValidator({
        getItems: () => allowedTypes,
        property: 'mimeType',
        errorKey: 'duplicateMimeType',
        caseSensitive: false,
        trim: true,
      });

      const duplicateControl = new FormControl('image/png');
      expect(validator(duplicateControl)).toEqual({
        duplicateMimeType: true,
        value: 'image/png',
      });

      const uniqueControl = new FormControl('image/jpeg');
      expect(validator(uniqueControl)).toBeNull();
    });
  });
});
