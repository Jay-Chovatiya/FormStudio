import { Service, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, map } from 'rxjs';
import { FormDefinition } from '../models/form-definition';
import { environment } from '../../../environment/environment';
import { stripGuidsFromForm } from '../utils/guid';

@Service()
export class FormService {
  private http = inject(HttpClient);
  private baseUrl = environment.formsEndpoint;

  getForms(): Observable<FormDefinition[]> {
    return this.http.get<FormDefinition[]>(this.baseUrl);
  }

  getFormById(id: number): Observable<FormDefinition | null> {
    return this.http.get<FormDefinition>(`${this.baseUrl}/${id}`);
  }

  getFormByCode(code: string): Observable<FormDefinition | null> {
    return this.http.get<FormDefinition>(`${this.baseUrl}/code/${code}`);
  }

  createForm(form: FormDefinition): Observable<FormDefinition> {
    const cleanPayload = stripGuidsFromForm(form);
    return this.http.post<FormDefinition>(this.baseUrl, cleanPayload);
  }

  updateForm(id: number, form: FormDefinition): Observable<FormDefinition> {
    const cleanPayload = stripGuidsFromForm(form);
    return this.http.put<FormDefinition>(`${this.baseUrl}/${id}`, cleanPayload);
  }

  deleteForm(id: number): Observable<boolean> {
    return this.http.delete(`${this.baseUrl}/${id}`).pipe(map(() => true));
  }

  updateFormStatus(id: number, status: string): Observable<FormDefinition | null> {
    return this.http.patch<FormDefinition>(`${this.baseUrl}/${id}/status/${status}`, {});
  }

  publishForm(id: number): Observable<FormDefinition | null> {
    return this.http.post<FormDefinition>(`${this.baseUrl}/${id}/publish`, {});
  }

  unpublishForm(id: number): Observable<FormDefinition | null> {
    return this.http.post<FormDefinition>(`${this.baseUrl}/${id}/unpublish`, {});
  }

  duplicateForm(id: number): Observable<FormDefinition | null> {
    return this.http.post<FormDefinition>(`${this.baseUrl}/${id}/duplicate`, {});
  }

  getFormPreview(id: number): Observable<FormDefinition | null> {
    return this.getFormById(id);
  }
}
