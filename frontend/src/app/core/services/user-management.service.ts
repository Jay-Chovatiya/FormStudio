import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, map } from 'rxjs';
import { environment } from '../../../environment/environment';
import { User, UserUpsertRequest } from '../models/user';

@Injectable({
  providedIn: 'root'
})
export class UserManagementService {
  private readonly http = inject(HttpClient);
  private readonly baseUrl = `${environment.apiBaseUrl}/users`;

  getUsers(): Observable<User[]> {
    return this.http.get<User[]>(this.baseUrl);
  }

  getUser(id: number): Observable<User> {
    return this.http.get<User>(`${this.baseUrl}/${id}`);
  }

  createUser(user: UserUpsertRequest): Observable<User> {
    return this.http.post<User>(this.baseUrl, user);
  }

  updateUser(id: number, user: UserUpsertRequest): Observable<User> {
    return this.http.put<User>(`${this.baseUrl}/${id}`, user);
  }

  toggleUserStatus(id: number): Observable<User> {
    return this.http.patch<User>(`${this.baseUrl}/${id}/toggle-status`, {});
  }

  deleteUser(id: number): Observable<boolean> {
    return this.http.delete(`${this.baseUrl}/${id}`).pipe(map(() => true));
  }
}
