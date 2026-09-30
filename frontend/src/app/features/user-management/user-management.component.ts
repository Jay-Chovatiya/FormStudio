import { Component, OnInit, signal, computed, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { UserManagementService } from '../../core/services/user-management.service';
import { AuthService } from '../../core/services/auth.service';
import { User, UserUpsertRequest, UserRole } from '../../core/models/user';
import { NavigationHistoryService } from '../../core/services/navigation-history.service';
import { emailValidator } from '../../core/utils/regex.constants';
import { ToastService } from '../../core/services/toast.service';

@Component({
  selector: 'app-user-management',
  standalone: true,
  imports: [CommonModule, FormsModule, ReactiveFormsModule],
  templateUrl: './user-management.component.html',
  styleUrl: './user-management.component.scss'
})
export class UserManagementComponent implements OnInit {
  private readonly userService = inject(UserManagementService);
  readonly authService = inject(AuthService);
  private readonly router = inject(Router);
  private readonly navHistory = inject(NavigationHistoryService);
  private readonly fb = inject(FormBuilder);
  private readonly toastService = inject(ToastService);

  readonly users = signal<User[]>([]);
  readonly loading = signal<boolean>(true);
  readonly error = signal<string | null>(null);
  readonly actionError = signal<string | null>(null);

  readonly searchTerm = signal<string>('');
  readonly selectedRole = signal<string>('ALL');
  readonly selectedStatus = signal<string>('ALL');

  // Modal state
  readonly isModalOpen = signal<boolean>(false);
  readonly isEditing = signal<boolean>(false);
  readonly currentUserId = signal<number | null>(null);
  readonly isSaving = signal<boolean>(false);

  userForm: FormGroup = this.fb.group({
    username: ['', [Validators.required, Validators.minLength(3)]],
    email: ['', [Validators.required, emailValidator]],
    fullName: ['', [Validators.required]],
    role: ['Administrator', [Validators.required]],
    password: ['', [Validators.required, Validators.minLength(6)]],
    isActive: [true]
  });

  readonly filteredUsers = computed(() => {
    const search = this.searchTerm().toLowerCase().trim();
    const role = this.selectedRole();
    const status = this.selectedStatus();

    return this.users().filter((user) => {
      const matchesSearch =
        !search ||
        user.username.toLowerCase().includes(search) ||
        user.email.toLowerCase().includes(search) ||
        (user.fullName && user.fullName.toLowerCase().includes(search));

      const matchesRole = role === 'ALL' || user.role === role;

      const matchesStatus =
        status === 'ALL' ||
        (status === 'ACTIVE' && user.isActive) ||
        (status === 'INACTIVE' && !user.isActive);

      return matchesSearch && matchesRole && matchesStatus;
    });
  });

  ngOnInit(): void {
    this.loadUsers();
  }

  loadUsers(): void {
    this.loading.set(true);
    this.error.set(null);

    this.userService.getUsers().subscribe({
      next: (data) => {
        this.users.set(data);
        this.loading.set(false);
      },
      error: (err) => {
        console.error('Failed to load users:', err);
        this.error.set('Failed to load users from the server.');
        this.loading.set(false);
      }
    });
  }

  openCreateModal(): void {
    this.isEditing.set(false);
    this.currentUserId.set(null);
    this.actionError.set(null);

    const passwordControl = this.userForm.get('password');
    passwordControl?.enable();
    passwordControl?.setValidators([Validators.required, Validators.minLength(6)]);

    this.userForm.reset({
      username: '',
      email: '',
      fullName: '',
      role: 'Administrator',
      password: '',
      isActive: true
    });
    passwordControl?.updateValueAndValidity();

    this.isModalOpen.set(true);
  }

  openEditModal(user: User): void {
    this.isEditing.set(true);
    this.currentUserId.set(user.id);
    this.actionError.set(null);

    const passwordControl = this.userForm.get('password');
    passwordControl?.clearValidators();
    passwordControl?.disable();
    passwordControl?.updateValueAndValidity();

    this.userForm.reset();
    this.userForm.patchValue({
      username: user.username,
      email: user.email,
      fullName: user.fullName || '',
      role: user.role,
      isActive: user.isActive
    });

    this.isModalOpen.set(true);
  }

  closeModal(): void {
    this.isModalOpen.set(false);
    this.actionError.set(null);
  }

  saveUser(): void {
    if (this.userForm.invalid) {
      this.userForm.markAllAsTouched();
      return;
    }

    this.isSaving.set(true);
    this.actionError.set(null);

    const formVal = this.userForm.getRawValue();
    const payload: UserUpsertRequest = {
      username: formVal.username,
      email: formVal.email,
      fullName: formVal.fullName || '',
      role: formVal.role as UserRole,
      isActive: formVal.isActive ?? true,
      password: formVal.password || undefined
    };

    if (this.isEditing()) {
      const id = this.currentUserId()!;
      this.userService.updateUser(id, payload).subscribe({
        next: (updatedUser) => {
          this.users.update((list) => list.map((u) => (u.id === id ? updatedUser : u)));
          this.isSaving.set(false);
          this.closeModal();
          this.toastService.success('User updated successfully!');
        },
        error: (err) => {
          this.isSaving.set(false);
          this.actionError.set(err.error?.message || 'Failed to update user.');
        }
      });
    } else {
      this.userService.createUser(payload).subscribe({
        next: (newUser) => {
          this.users.update((list) => [newUser, ...list]);
          this.isSaving.set(false);
          this.closeModal();
          this.toastService.success('User created successfully!');
        },
        error: (err) => {
          this.isSaving.set(false);
          this.actionError.set(err.error?.message || 'Failed to create user.');
        }
      });
    }
  }

  deleteUser(user: User): void {
    const currentUsername = this.authService.currentUser()?.username;
    if (user.username === currentUsername) {
      this.toastService.warning('You cannot delete your own account.');
      return;
    }

    if (!confirm(`Are you sure you want to delete user "${user.username}"? This action cannot be undone.`)) {
      return;
    }

    this.userService.deleteUser(user.id).subscribe({
      next: () => {
        this.users.update((list) => list.filter((u) => u.id !== user.id));
        this.toastService.success(`User "${user.username}" deleted successfully!`);
      }
    });
  }

  backToForms(): void {
    this.navHistory.back('/forms');
  }
}
