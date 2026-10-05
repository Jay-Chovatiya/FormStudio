import { FieldTypes } from './field-types';

export interface FieldPaletteItem {
  type: FieldTypes;
  label: string;
  disabled?: boolean;
}

export const fieldPalette: FieldPaletteItem[] = [
  {
    type: 'Textbox',
    label: 'Textbox',
  },
  {
    type: 'Textarea',
    label: 'Textarea',
  },
  {
    type: 'Number',
    label: 'Number',
  },
  {
    type: 'Email',
    label: 'Email',
  },
  {
    type: 'Date',
    label: 'Date Picker',
  },
  {
    type: 'DateTime',
    label: 'Date time Picker',
  },
  {
    type: 'Dropdown',
    label: 'Dropdown',
  },
  {
    type: 'RadioButton',
    label: 'Radio Button',
  },
  {
    type: 'Checkbox',
    label: 'Checkbox',
  },
  {
    type: 'File',
    label: 'File upload',
  },
];
