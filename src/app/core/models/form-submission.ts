import { FormResponse } from './form-response';

export interface FormSubmission {
  id?: number | string;
  formId: number;
  formCode?: string;
  formName?: string;
  responses: FormResponse[];
  isDraft?: boolean;
  submittedAt?: string;
  respondentName?: string;
  respondentEmail?: string;
}
