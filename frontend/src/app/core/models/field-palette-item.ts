import { FieldTypes } from './field-types';

export interface FieldPaletteItem {
  type: FieldTypes;
  label: string;
  description: string;
  icon: string;
  category: 'Basic' | 'Selection' | 'Advanced';
  disabled?: boolean;
}

export const fieldPalette: FieldPaletteItem[] = [
  {
    type: 'Textbox',
    label: 'Textbox',
    description: 'Single-line text input',
    icon: 'text',
    category: 'Basic',
  },
  {
    type: 'Textarea',
    label: 'Textarea',
    description: 'Multi-line text input',
    icon: 'align-left',
    category: 'Basic',
  },
  {
    type: 'Number',
    label: 'Number',
    description: 'Numeric value input',
    icon: 'hash',
    category: 'Basic',
  },
  {
    type: 'Email',
    label: 'Email',
    description: 'Email address input with format check',
    icon: 'mail',
    category: 'Basic',
  },
  {
    type: 'Date',
    label: 'Date Picker',
    description: 'Calendar date selection',
    icon: 'calendar',
    category: 'Basic',
  },
  {
    type: 'DateTime',
    label: 'Date time Picker',
    description: 'Calendar date selection',
    icon: 'calendar',
    category: 'Basic',
  },
  {
    type: 'Dropdown',
    label: 'Dropdown',
    description: 'Single select menu',
    icon: 'chevron-down',
    category: 'Selection',
  },
  {
    type: 'RadioButton',
    label: 'Radio Button',
    description: 'Single choice options',
    icon: 'disc',
    category: 'Selection',
  },
  {
    type: 'Checkbox',
    label: 'Checkbox',
    description: 'Boolean toggle or multi-select options',
    icon: 'check-square',
    category: 'Selection',
  },
];
