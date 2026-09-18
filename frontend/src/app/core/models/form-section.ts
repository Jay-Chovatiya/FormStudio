import { FormField } from "./form-field";

export interface FormSection {
  id: number;
  title: string;
  description?: string;
  theme?: string;
  visibility: boolean;
  fields: FormField[];
}
