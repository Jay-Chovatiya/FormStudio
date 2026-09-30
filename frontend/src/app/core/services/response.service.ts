import { Service, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, map } from 'rxjs';
import { FormSubmission } from '../models/form-submission';
import { FormDefinition } from '../models/form-definition';
import { environment } from '../../../environment/environment';

@Service()
export class ResponseService {
  private http = inject(HttpClient);
  private baseUrl = environment.formsEndpoint;

  getSubmissions(formId: number): Observable<FormSubmission[]> {
    return this.http.get<FormSubmission[]>(`${this.baseUrl}/${formId}/submissions`);
  }

  submitForm(code: string, submission: FormSubmission): Observable<FormSubmission> {
    return this.http.post<FormSubmission>(`${this.baseUrl}/code/${code}/submissions`, submission);
  }

  deleteSubmission(formId: number, submissionId: string | number): Observable<boolean> {
    return this.http.delete(`${this.baseUrl}/${formId}/submissions/${submissionId}`).pipe(map(() => true));
  }

  exportToCsv(form: FormDefinition, submissions: FormSubmission[]): void {
    if (!submissions || submissions.length === 0) return;

    // Collect all field headers
    const allFields = form.sections.flatMap((s) => s.fields);
    const headers = ['Submission ID', 'Submitted At', ...allFields.map((f) => f.label)];

    const rows = submissions.map((sub, index) => {
      const responseMap = new Map<number, unknown>();
      sub.responses.forEach((r) => responseMap.set(r.fieldId, r.value));

      const fieldValues = allFields.map((field) => {
        const val = responseMap.get(field.id);
        if (val === undefined || val === null) return '""';
        if (Array.isArray(val)) return `"${val.join('; ').replace(/"/g, '""')}"`;
        return `"${String(val).replace(/"/g, '""')}"`;
      });

      return [
        `"${index + 1}"`,
        `"${sub.submittedAt || ''}"`,
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
