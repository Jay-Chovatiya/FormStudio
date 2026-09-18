import { FormResponse } from './form-response';

export interface FormSubmission {
  id?: number | string;
  formId: number;
  responses: FormResponse[];
  submittedAt?: string;
}
