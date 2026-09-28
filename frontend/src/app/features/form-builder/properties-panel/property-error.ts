export type PropertyName =
  | 'label'
  | 'name'
  | 'helperDescription'
  | 'placeholder'
  | 'default'
  | 'minLength'
  | 'maxLength'
  | 'minValue'
  | 'maxValue'
  | 'pattern'
  | 'options'
  | 'title'
  | 'code';

export interface PropertyError {
  property: PropertyName;
  message: string;
}
