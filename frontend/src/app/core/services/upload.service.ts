import { Service, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environment/environment';

@Service()
export class UploadService {
  private readonly http = inject(HttpClient);
  private readonly formsBaseUrl = environment.formsEndpoint;

  uploadFile(code: string, file: File, fieldName: string): Observable<{ fileUrl: string }> {
    const formData = new FormData();
    formData.append('file', file, file.name);

    const url = `${this.formsBaseUrl}/${code}/upload?fieldName=${encodeURIComponent(fieldName)}`;
    return this.http.post<{ fileUrl: string }>(url, formData);
  }

  downloadFile(fullOrRelativeUrl: string): Observable<Blob> {
    const downloadUrl = `${environment.baseUrl}${fullOrRelativeUrl.startsWith('/') ? fullOrRelativeUrl : '/' + fullOrRelativeUrl}`;

    return this.http.get(downloadUrl, { responseType: 'blob' });
  }
}
