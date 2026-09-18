export type FieldValidation =
  | { type: 'required' }
  | { type: 'email' }
  | { type: 'pattern'; value: string }
  | { type: 'minLength'; value: number }
  | { type: 'maxLength'; value: number }
  | { type: 'minValue'; value: number }
  | { type: 'maxValue'; value: number };
