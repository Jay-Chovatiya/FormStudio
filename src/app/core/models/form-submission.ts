import { FormResponse } from './form-response';

export interface FormSubmission {
  formId: number;
  responses: FormResponse[];
}
