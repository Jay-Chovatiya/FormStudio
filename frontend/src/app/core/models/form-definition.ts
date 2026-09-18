import { FormSection } from './form-section';
import { FormStatus } from './form-status';

export interface FormDefinition {
  id: number;
  name: string;
  description: string;
  code: string;
  category?: string;
  status: FormStatus;
  startDate?: string;
  endDate?: string;
  allowMultipleSubmissions?: boolean;
  allowSaveAsDraft?: boolean;
  confirmationMessage?: string;
  submitButtonText?: string;
  cancelButtonText?: string;
  theme?: string;
  logoUrl?: string;
  headerText?: string;
  footerText?: string;
  sections: FormSection[];
  createdAt?: string;
  updatedAt?: string;
}
