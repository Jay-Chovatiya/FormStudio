import { Service, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, map } from 'rxjs';
import { FormDefinition } from '../models/form-definition';
import { ApiResponse } from '../models/api-response';
import { environment } from '../../../environment/environment';
import { stripGuidsFromForm } from '../utils/guid';

@Service()
export class FormService {
  private http = inject(HttpClient);
  private baseUrl = environment.formsEndpoint;

  getForms(): Observable<FormDefinition[]> {
    return this.http.get<ApiResponse<FormDefinition[]>>(this.baseUrl).pipe(map(res => res.data));
  }

  getFormById(id: number, includeDeleted: boolean = false): Observable<FormDefinition | null> {
    const url = includeDeleted ? `${this.baseUrl}/${id}?includeDeleted=true` : `${this.baseUrl}/${id}`;
    return this.http.get<ApiResponse<FormDefinition>>(url).pipe(map(res => res.data));
  }

  getFormByCode(code: string): Observable<FormDefinition | null> {
    return this.http.get<ApiResponse<FormDefinition>>(`${this.baseUrl}/code/${code}`).pipe(map(res => res.data));
  }

  createForm(form: FormDefinition): Observable<FormDefinition> {
    const cleanPayload = stripGuidsFromForm(form);
    return this.http.post<ApiResponse<FormDefinition>>(this.baseUrl, cleanPayload).pipe(map(res => res.data));
  }

  updateForm(id: number, form: FormDefinition): Observable<FormDefinition> {
    const cleanPayload = stripGuidsFromForm(form);
    return this.http.put<ApiResponse<FormDefinition>>(`${this.baseUrl}/${id}`, cleanPayload).pipe(map(res => res.data));
  }

  deleteForm(id: number): Observable<boolean> {
    return this.http.delete<ApiResponse<unknown>>(`${this.baseUrl}/${id}`).pipe(map(() => true));
  }

  updateFormStatus(id: number, status: string): Observable<FormDefinition | null> {
    return this.http.patch<ApiResponse<FormDefinition>>(`${this.baseUrl}/${id}/status/${status}`, {}).pipe(map(res => res.data));
  }

  publishForm(id: number): Observable<FormDefinition | null> {
    return this.http.post<ApiResponse<FormDefinition>>(`${this.baseUrl}/${id}/publish`, {}).pipe(map(res => res.data));
  }

  unpublishForm(id: number): Observable<FormDefinition | null> {
    return this.http.post<ApiResponse<FormDefinition>>(`${this.baseUrl}/${id}/unpublish`, {}).pipe(map(res => res.data));
  }

  duplicateForm(id: number): Observable<FormDefinition | null> {
    return this.http.post<ApiResponse<FormDefinition>>(`${this.baseUrl}/${id}/duplicate`, {}).pipe(map(res => res.data));
  }

  getFormPreview(id: number): Observable<FormDefinition | null> {
    return this.getFormById(id);
  }
}
