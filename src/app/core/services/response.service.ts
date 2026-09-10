import { Service, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, of } from 'rxjs';
import { FormSubmission } from '../models/form-submission';
import { FormDefinition } from '../models/form-definition';
import { MockBackendService } from './mock-backend.service';

@Service()
export class ResponseService {
  private http = inject(HttpClient);
  private mockBackend = inject(MockBackendService);
  private useMock = true;

  getSubmissions(formId: number): Observable<FormSubmission[]> {
    if (this.useMock) {
      return of(this.mockBackend.getSubmissions(formId));
    }
    return this.http.get<FormSubmission[]>(`/api/forms/${formId}/submissions`);
  }

  submitForm(formId: number, submission: FormSubmission): Observable<FormSubmission> {
    if (this.useMock) {
      return of(this.mockBackend.saveSubmission({ ...submission, formId }));
    }
    return this.http.post<FormSubmission>(`/api/forms/${formId}/submissions`, submission);
  }

  deleteSubmission(formId: number, submissionId: string | number): Observable<boolean> {
    if (this.useMock) {
      return of(this.mockBackend.deleteSubmission(submissionId));
    }
    return this.http.delete<boolean>(`/api/forms/${formId}/submissions/${submissionId}`);
  }

  exportToCsv(form: FormDefinition, submissions: FormSubmission[]): void {
    if (!submissions || submissions.length === 0) return;

    // Collect all field headers
    const allFields = form.sections.flatMap((s) => s.fields);
    const headers = ['Submission ID', 'Submitted At', 'Respondent', ...allFields.map((f) => f.label)];

    const rows = submissions.map((sub) => {
      const responseMap = new Map<number, any>();
      sub.responses.forEach((r) => responseMap.set(r.fieldId, r.value));

      const fieldValues = allFields.map((field) => {
        const val = responseMap.get(field.id);
        if (val === undefined || val === null) return '""';
        if (Array.isArray(val)) return `"${val.join('; ').replace(/"/g, '""')}"`;
        return `"${String(val).replace(/"/g, '""')}"`;
      });

      return [
        `"${sub.id}"`,
        `"${sub.submittedAt || ''}"`,
        `"${sub.respondentEmail || sub.respondentName || 'Anonymous'}"`,
        ...fieldValues,
      ].join(',');
    });

    const csvContent = [headers.join(','), ...rows].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', `${form.code || 'form'}_responses_${Date.now()}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  }
}
