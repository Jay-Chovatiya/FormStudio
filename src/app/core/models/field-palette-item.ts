import { FieldTypes } from './field-types';

export interface FieldPaletteItem {
  type: FieldTypes;
  label: string;
  icon?: string;
}

export const fieldPalette: FieldPaletteItem[] = [
  {
    type: 'Textbox',
    label: 'Textbox',
    icon: 'text',
  },
  {
    type: 'Email',
    label: 'Email',
    icon: 'email',
  },
  {
    type: 'Number',
    label: 'Number',
    icon: 'number',
  },
  {
    type: 'Textarea',
    label: 'Text Area',
    icon: 'text',
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
    type: 'Dropdown',
    label: 'Dropdown',
  },
  {
    type: 'Date',
    label: 'Date',
  },
];
