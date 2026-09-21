import { Service } from '@angular/core';
import { FormDefinition } from '../models/form-definition';
import { FormSubmission } from '../models/form-submission';

const FORMS_STORAGE_KEY = 'form_studio_forms_v1';
const SUBMISSIONS_STORAGE_KEY = 'form_studio_submissions_v1';

@Service()
export class MockBackendService {
  constructor() {
    this.seedInitialData();
  }

  private seedInitialData(): void {
    const existingForms = localStorage.getItem(FORMS_STORAGE_KEY);
    if (!existingForms || JSON.parse(existingForms).length === 0) {
      const sampleForms: FormDefinition[] = [
        {
          id: 101,
          name: 'Employee Feedback Form',
          code: 'emp-feedback-2026',
          description: 'Gather feedback regarding workplace environment, team support, and career growth.',
          category: 'Human Resources',
          status: 'Published',
          allowMultipleSubmissions: false,
          allowSaveAsDraft: true,
          confirmationMessage: 'Thank you for your valuable feedback! Your response has been recorded.',
          submitButtonText: 'Submit Feedback',
          cancelButtonText: 'Clear',
          createdAt: new Date(Date.now() - 7 * 86400000).toISOString(),
          updatedAt: new Date().toISOString(),
          sections: [
            {
              id: 1,
              title: 'Personal & Department Details',
              description: 'Basic details to help us contextually evaluate response trends.',
              visibility: true,
              fields: [
                {
                  id: 11,
                  name: 'employeeName',
                  label: 'Full Name',
                  type: 'Textbox',
                  placeholder: 'e.g. John Doe',
                  helperDescription: 'Optional: Leave blank if you wish to respond anonymously',
                  visibility: true,
                  validations: [{ type: 'minLength', value: 2 }],
                },
                {
                  id: 12,
                  name: 'email',
                  label: 'Corporate Email',
                  type: 'Email',
                  placeholder: 'john.doe@company.com',
                  visibility: true,
                  validations: [{ type: 'required' }, { type: 'email' }],
                },
                {
                  id: 13,
                  name: 'department',
                  label: 'Department',
                  type: 'Dropdown',
                  visibility: true,
                  validations: [{ type: 'required' }],
                  options: [
                    { id: 1, label: 'Engineering', value: 'Engineering' },
                    { id: 2, label: 'Human Resources', value: 'HR' },
                    { id: 3, label: 'Product & Design', value: 'Product' },
                    { id: 4, label: 'Sales & Marketing', value: 'Sales' },
                  ],
                },
              ],
            },
            {
              id: 2,
              title: 'Workplace Assessment',
              description: 'Please rate your recent work experience and project satisfaction.',
              visibility: true,
              fields: [
                {
                  id: 14,
                  name: 'satisfactionLevel',
                  label: 'Overall Job Satisfaction',
                  type: 'RadioButton',
                  visibility: true,
                  validations: [{ type: 'required' }],
                  options: [
                    { id: 1, label: 'Very Satisfied', value: 'very_satisfied' },
                    { id: 2, label: 'Satisfied', value: 'satisfied' },
                    { id: 3, label: 'Neutral', value: 'neutral' },
                    { id: 4, label: 'Unsatisfied', value: 'unsatisfied' },
                  ],
                },
                {
                  id: 15,
                  name: 'workplacePerks',
                  label: 'Selected Perks You Value Most',
                  type: 'Checkbox',
                  visibility: true,
                  options: [
                    { id: 1, label: 'Flexible Work Hours', value: 'flex_hours' },
                    { id: 2, label: 'Remote / Hybrid Policy', value: 'remote' },
                    { id: 3, label: 'Learning & Certification Budget', value: 'learning' },
                    { id: 4, label: 'Health & Wellness Allowance', value: 'wellness' },
                  ],
                },
                {
                  id: 16,
                  name: 'comments',
                  label: 'Detailed Comments & Suggestions',
                  type: 'Textarea',
                  placeholder: 'Share any ideas on how we can improve our culture and productivity...',
                  helperDescription: 'Maximum 1000 characters',
                  visibility: true,
                  validations: [{ type: 'maxLength', value: 1000 }],
                },
                {
                  id: 17,
                  name: 'reviewDate',
                  label: 'Preferred Discussion Date',
                  type: 'Date',
                  visibility: true,
                },
              ],
            },
          ],
        },
        {
          id: 102,
          name: 'Customer Satisfaction Survey',
          code: 'csat-q3-2026',
          description: 'Quarterly CSAT survey for evaluating platform reliability and support speed.',
          category: 'Customer Service',
          status: 'Published',
          allowMultipleSubmissions: true,
          allowSaveAsDraft: true,
          confirmationMessage: 'We appreciate your input! You are helping us build a better platform.',
          submitButtonText: 'Send Review',
          createdAt: new Date(Date.now() - 14 * 86400000).toISOString(),
          updatedAt: new Date(Date.now() - 2 * 86400000).toISOString(),
          sections: [
            {
              id: 1,
              title: 'Service Rating',
              visibility: true,
              fields: [
                {
                  id: 21,
                  name: 'supportRating',
                  label: 'Support Response Speed',
                  type: 'RadioButton',
                  visibility: true,
                  validations: [{ type: 'required' }],
                  options: [
                    { id: 1, label: 'Excellent (< 1 hour)', value: 'excellent' },
                    { id: 2, label: 'Good (Same day)', value: 'good' },
                    { id: 3, label: 'Average (1-2 days)', value: 'average' },
                    { id: 4, label: 'Poor (> 2 days)', value: 'poor' },
                  ],
                },
                {
                  id: 22,
                  name: 'recommendScore',
                  label: 'Likelihood to Recommend (1-10)',
                  type: 'Number',
                  placeholder: 'Enter 1 to 10',
                  visibility: true,
                  validations: [{ type: 'required' }, { type: 'minValue', value: 1 }, { type: 'maxValue', value: 10 }],
                },
              ],
            },
          ],
        },
      ];
      localStorage.setItem(FORMS_STORAGE_KEY, JSON.stringify(sampleForms));
    }

    const existingSubmissions = localStorage.getItem(SUBMISSIONS_STORAGE_KEY);
    if (!existingSubmissions || JSON.parse(existingSubmissions).length === 0) {
      const sampleSubmissions: FormSubmission[] = [
        {
          id: 'sub_1',
          formId: 101,
          submittedAt: new Date(Date.now() - 2 * 86400000).toISOString(),
          responses: [
            { fieldId: 11, value: 'Jane Smith' },
            { fieldId: 12, value: 'jane.smith@company.com' },
            { fieldId: 13, value: 'Engineering' },
            { fieldId: 14, value: 'very_satisfied' },
            { fieldId: 15, value: ['flex_hours', 'learning'] },
            { fieldId: 16, value: 'Great team culture and strong engineering practices!' },
            { fieldId: 17, value: '2026-09-15' },
          ],
        },
        {
          id: 'sub_2',
          formId: 101,
          submittedAt: new Date(Date.now() - 1 * 86400000).toISOString(),
          responses: [
            { fieldId: 11, value: 'Alex Rivera' },
            { fieldId: 12, value: 'alex.rivera@company.com' },
            { fieldId: 13, value: 'Product' },
            { fieldId: 14, value: 'satisfied' },
            { fieldId: 15, value: ['remote', 'wellness'] },
            { fieldId: 16, value: 'Overall happy, would like more cross-team workshops.' },
          ],
        },
      ];
      localStorage.setItem(SUBMISSIONS_STORAGE_KEY, JSON.stringify(sampleSubmissions));
    }
  }

  // Forms API
  getForms(): FormDefinition[] {
    const raw = localStorage.getItem(FORMS_STORAGE_KEY);
    return raw ? JSON.parse(raw) : [];
  }

  getFormById(id: number): FormDefinition | null {
    const forms = this.getForms();
    return forms.find((f) => f.id === id) ?? null;
  }

  getFormByCode(code: string): FormDefinition | null {
    const forms = this.getForms();
    return forms.find((f) => f.code === code) ?? null;
  }

  saveForm(form: FormDefinition): FormDefinition {
    const forms = this.getForms();
    const index = forms.findIndex((f) => f.id === form.id);
    const updatedForm = { ...form, updatedAt: new Date().toISOString() };

    if (index >= 0) {
      forms[index] = updatedForm;
    } else {
      if (!updatedForm.id) updatedForm.id = Date.now();
      if (!updatedForm.createdAt) updatedForm.createdAt = new Date().toISOString();
      forms.push(updatedForm);
    }

    localStorage.setItem(FORMS_STORAGE_KEY, JSON.stringify(forms));
    return updatedForm;
  }

  deleteForm(id: number): boolean {
    const forms = this.getForms().filter((f) => f.id !== id);
    localStorage.setItem(FORMS_STORAGE_KEY, JSON.stringify(forms));
    return true;
  }

  publishForm(id: number): FormDefinition | null {
    const form = this.getFormById(id);
    if (!form) return null;
    form.status = 'Published';
    return this.saveForm(form);
  }

  unpublishForm(id: number): FormDefinition | null {
    const form = this.getFormById(id);
    if (!form) return null;
    form.status = 'Unpublished';
    return this.saveForm(form);
  }

  duplicateForm(id: number): FormDefinition | null {
    const form = this.getFormById(id);
    if (!form) return null;
    const duplicated: FormDefinition = {
      ...structuredClone(form),
      id: Date.now(),
      name: `${form.name} (Copy)`,
      code: `${form.code}-copy-${Math.floor(Math.random() * 1000)}`,
      status: 'Draft',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    return this.saveForm(duplicated);
  }

  // Submissions API
  getSubmissions(formId: number): FormSubmission[] {
    const raw = localStorage.getItem(SUBMISSIONS_STORAGE_KEY);
    const all: FormSubmission[] = raw ? JSON.parse(raw) : [];
    return all.filter((s) => s.formId === formId);
  }

  saveSubmission(submission: FormSubmission): FormSubmission {
    const raw = localStorage.getItem(SUBMISSIONS_STORAGE_KEY);
    const all: FormSubmission[] = raw ? JSON.parse(raw) : [];
    const newSubmission: FormSubmission = {
      ...submission,
      id: submission.id || `sub_${Date.now()}`,
      submittedAt: new Date().toISOString(),
    };
    all.unshift(newSubmission);
    localStorage.setItem(SUBMISSIONS_STORAGE_KEY, JSON.stringify(all));
    return newSubmission;
  }

  deleteSubmission(submissionId: string | number): boolean {
    const raw = localStorage.getItem(SUBMISSIONS_STORAGE_KEY);
    const all: FormSubmission[] = raw ? JSON.parse(raw) : [];
    const filtered = all.filter((s) => String(s.id) !== String(submissionId));
    localStorage.setItem(SUBMISSIONS_STORAGE_KEY, JSON.stringify(filtered));
    return true;
  }
}
