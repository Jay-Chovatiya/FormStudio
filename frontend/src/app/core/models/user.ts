export type UserRole = 'Administrator' | 'SuperAdministrator';

export interface User {
  id: number;
  username: string;
  email: string;
  fullName?: string;
  role: UserRole;
  isActive: boolean;
  createdAt?: string;
  updatedAt?: string;
}

export interface LoginDto {
  usernameOrEmail: string;
  password: string;
  rememberMe?: boolean;
}

export interface AuthResponseDto {
  token: string;
  user: User;
  expiresAt: string;
}


export interface UserUpsertRequest {
  username: string;
  email: string;
  password?: string;
  fullName?: string;
  role: UserRole;
  isActive: boolean;
}
