import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, map } from 'rxjs';
import { environment } from '../../../environment/environment';
import { User, UserUpsertRequest } from '../models/user';
import { ApiResponse } from '../models/api-response';

@Injectable({
  providedIn: 'root'
})
export class UserManagementService {
  private readonly http = inject(HttpClient);
  private readonly baseUrl = `${environment.apiBaseUrl}/users`;

  getUsers(): Observable<User[]> {
    return this.http.get<ApiResponse<User[]>>(this.baseUrl).pipe(map(res => res.data));
  }

  getUser(id: number): Observable<User> {
    return this.http.get<ApiResponse<User>>(`${this.baseUrl}/${id}`).pipe(map(res => res.data));
  }

  createUser(user: UserUpsertRequest): Observable<User> {
    return this.http.post<ApiResponse<User>>(this.baseUrl, user).pipe(map(res => res.data));
  }

  updateUser(id: number, user: UserUpsertRequest): Observable<User> {
    return this.http.put<ApiResponse<User>>(`${this.baseUrl}/${id}`, user).pipe(map(res => res.data));
  }

  toggleUserStatus(id: number): Observable<User> {
    return this.http.patch<ApiResponse<User>>(`${this.baseUrl}/${id}/toggle-status`, {}).pipe(map(res => res.data));
  }

  deleteUser(id: number): Observable<boolean> {
    return this.http.delete<ApiResponse<unknown>>(`${this.baseUrl}/${id}`).pipe(map(() => true));
  }
}
