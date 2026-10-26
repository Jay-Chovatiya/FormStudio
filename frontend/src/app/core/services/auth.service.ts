import { Injectable, inject, signal, computed } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Router } from '@angular/router';
import { Observable, tap, map } from 'rxjs';
import { environment } from '../../../environment/environment';
import { User, LoginDto, AuthResponseDto } from '../models/user';
import { ApiResponse } from '../models/api-response';

@Injectable({
  providedIn: 'root'
})
export class AuthService {
  private readonly http = inject(HttpClient);
  private readonly router = inject(Router);

  private readonly TOKEN_KEY = 'formstudio_auth_token';
  private readonly USER_KEY = 'formstudio_auth_user';

  readonly token = signal<string | null>(this.getStoredToken());
  readonly currentUser = signal<User | null>(this.getStoredUser());

  readonly isAuthenticated = computed(() => !!this.token() && !!this.currentUser());
  readonly isSuperAdmin = computed(() => this.currentUser()?.role === 'SuperAdministrator');
  readonly isAdmin = computed(() => {
    const role = this.currentUser()?.role;
    return role === 'Administrator' || role === 'SuperAdministrator';
  });

  login(credentials: LoginDto): Observable<AuthResponseDto> {
    return this.http.post<ApiResponse<AuthResponseDto>>(`${environment.apiBaseUrl}/auth/login`, credentials, {
      withCredentials: true
    }).pipe(
      map(response => response.data),
      tap((response) => {
        this.setSession(response);
      })
    );
  }

  refreshToken(): Observable<AuthResponseDto> {
    return this.http.post<ApiResponse<AuthResponseDto>>(`${environment.apiBaseUrl}/auth/refresh-token`, {}, {
      withCredentials: true
    }).pipe(
      map(response => response.data),
      tap((response) => {
        this.setSession(response);
      })
    );
  }

  logout(): void {
    this.http.post(`${environment.apiBaseUrl}/auth/revoke-token`, {}, {
      withCredentials: true
    }).subscribe({
      next: () => {},
      error: () => {}
    });

    this.clearSession();
    this.router.navigate(['/login']);
  }

  getCurrentUser(): Observable<User> {
    return this.http.get<ApiResponse<User>>(`${environment.apiBaseUrl}/auth/me`, {
      withCredentials: true
    }).pipe(
      map(response => response.data),
      tap((user) => {
        this.currentUser.set(user);
        if (typeof window !== 'undefined') {
          localStorage.setItem(this.USER_KEY, JSON.stringify(user));
        }
      })
    );
  }

  updateCurrentUser(user: User): void {
    this.currentUser.set(user);
    if (typeof window !== 'undefined') {
      localStorage.setItem(this.USER_KEY, JSON.stringify(user));
    }
  }

  private setSession(authResult: AuthResponseDto): void {
    this.token.set(authResult.token);
    this.currentUser.set(authResult.user);

    if (typeof window !== 'undefined') {
      localStorage.setItem(this.TOKEN_KEY, authResult.token);
      localStorage.setItem(this.USER_KEY, JSON.stringify(authResult.user));
    }
  }

  private clearSession(): void {
    this.token.set(null);
    this.currentUser.set(null);

    if (typeof window !== 'undefined') {
      localStorage.removeItem(this.TOKEN_KEY);
      localStorage.removeItem(this.USER_KEY);
    }
  }

  private getStoredToken(): string | null {
    if (typeof window !== 'undefined') {
      return localStorage.getItem(this.TOKEN_KEY);
    }
    return null;
  }

  private getStoredUser(): User | null {
    if (typeof window !== 'undefined') {
      const userJson = localStorage.getItem(this.USER_KEY);
      if (userJson) {
        try {
          return JSON.parse(userJson) as User;
        } catch {
          return null;
        }
      }
    }
    return null;
  }
}
