import { FormField } from "./form-field";

export interface FormSection {
  id: number;
  guid?: string;
  title: string;
  description?: string;
  theme?: string;
  visibility: boolean;
  displayOrder?: number;
  fields: FormField[];
}
