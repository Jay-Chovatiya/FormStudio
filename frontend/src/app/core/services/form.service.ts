import { Service, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, of } from 'rxjs';
import { FormDefinition } from '../models/form-definition';
import { MockBackendService } from './mock-backend.service';
import { environment } from '../../../environment/environment';
import { stripGuidsFromForm } from '../utils/guid';

@Service()
export class FormService {
  private http = inject(HttpClient);
  private mockBackend = inject(MockBackendService);
  private baseUrl = environment.formsEndpoint;
  private useMock = environment.useMock;

  getForms(): Observable<FormDefinition[]> {
    if (this.useMock) {
      return of(this.mockBackend.getForms());
    }
    return this.http.get<FormDefinition[]>(this.baseUrl);
  }

  getFormById(id: number): Observable<FormDefinition | null> {
    if (this.useMock) {
      return of(this.mockBackend.getFormById(id));
    }
    return this.http.get<FormDefinition>(`${this.baseUrl}/${id}`);
  }

  getFormByCode(code: string): Observable<FormDefinition | null> {
    if (this.useMock) {
      return of(this.mockBackend.getFormByCode(code));
    }
    return this.http.get<FormDefinition>(`${this.baseUrl}/code/${code}`);
  }

  createForm(form: FormDefinition): Observable<FormDefinition> {
    if (this.useMock) {
      return of(this.mockBackend.saveForm(form));
    }
    const cleanPayload = stripGuidsFromForm(form);
    return this.http.post<FormDefinition>(this.baseUrl, cleanPayload);
  }

  updateForm(id: number, form: FormDefinition): Observable<FormDefinition> {
    if (this.useMock) {
      return of(this.mockBackend.saveForm(form));
    }
    const cleanPayload = stripGuidsFromForm(form);
    return this.http.put<FormDefinition>(`${this.baseUrl}/${id}`, cleanPayload);
  }

  deleteForm(id: number): Observable<boolean> {
    if (this.useMock) {
      return of(this.mockBackend.deleteForm(id));
    }
    return this.http.delete<boolean>(`${this.baseUrl}/${id}`);
  }

  updateFormStatus(id: number, status: string): Observable<FormDefinition | null> {
    if (this.useMock) {
      return of(this.mockBackend.getFormById(id));
    }
    return this.http.patch<FormDefinition>(`${this.baseUrl}/${id}/status/${status}`, {});
  }

  publishForm(id: number): Observable<FormDefinition | null> {
    if (this.useMock) {
      return of(this.mockBackend.publishForm(id));
    }
    return this.http.post<FormDefinition>(`${this.baseUrl}/${id}/publish`, {});
  }

  unpublishForm(id: number): Observable<FormDefinition | null> {
    if (this.useMock) {
      return of(this.mockBackend.unpublishForm(id));
    }
    return this.http.post<FormDefinition>(`${this.baseUrl}/${id}/unpublish`, {});
  }

  duplicateForm(id: number): Observable<FormDefinition | null> {
    if (this.useMock) {
      return of(this.mockBackend.duplicateForm(id));
    }
    return this.http.post<FormDefinition>(`${this.baseUrl}/${id}/duplicate`, {});
  }

  getFormPreview(id: number): Observable<FormDefinition | null> {
    return this.getFormById(id);
  }
}
