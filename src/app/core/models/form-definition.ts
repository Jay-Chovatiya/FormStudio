import { FormSection } from './form-section';
import { FormStatus } from './form-status';

export interface FormDefinition {
  id: number;
  name: string;
  description: string;
  code: string;
  status: FormStatus;
  sections: FormSection[];
}
