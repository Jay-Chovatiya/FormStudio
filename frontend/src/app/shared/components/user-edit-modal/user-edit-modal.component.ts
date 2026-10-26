import { Component, input, output, signal, computed, inject, effect, untracked } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { AuthService } from '../../../core/services/auth.service';
import { UserManagementService } from '../../../core/services/user-management.service';
import { ToastService } from '../../../core/services/toast.service';
import { User, UserRole, UserUpsertRequest } from '../../../core/models/user';
import { emailValidator } from '../../../core/utils/regex.constants';

@Component({
  selector: 'app-user-edit-modal',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './user-edit-modal.component.html',
  styleUrl: './user-edit-modal.component.scss'
})
export class UserEditModalComponent {
  private readonly fb = inject(FormBuilder);
  readonly authService = inject(AuthService);
  private readonly userService = inject(UserManagementService);
  private readonly toastService = inject(ToastService);

  readonly isOpen = input<boolean>(false);
  readonly user = input<User | null>(null);

  readonly saved = output<User>();
  readonly closed = output<void>();

  readonly isSaving = signal<boolean>(false);
  readonly actionError = signal<string | null>(null);
  readonly showPassword = signal<boolean>(false);

  readonly isEditing = computed(() => !!this.user());
  readonly isEditingSelf = computed(() => {
    const u = this.user();
    const current = this.authService.currentUser();
    if (!u || !current) return false;
    return u.id === current.id || u.username === current.username;
  });

  readonly canEditRoleAndStatus = computed(() => {
    return this.authService.isSuperAdmin();
  });

  readonly modalTitle = computed(() => {
    if (!this.isEditing()) return 'Create New User';
    return this.isEditingSelf() ? 'Edit Profile' : 'Edit User';
  });

  userForm: FormGroup = this.fb.group({
    username: ['', [Validators.required, Validators.minLength(3)]],
    email: ['', [Validators.required, emailValidator]],
    fullName: [''],
    role: ['Administrator', [Validators.required]],
    password: ['', [Validators.required, Validators.minLength(6)]],
    isActive: [true]
  });

  constructor() {
    effect(() => {
      const open = this.isOpen();
      const targetUser = this.user();
      untracked(() => {
        if (open) {
          this.setupForm(targetUser);
        }
      });
    });
  }

  togglePasswordVisibility(): void {
    this.showPassword.update((val) => !val);
  }

  private setupForm(user: User | null): void {
    this.actionError.set(null);
    this.showPassword.set(false);

    const isSelf = !!user && (
      this.authService.currentUser()?.id === user.id ||
      this.authService.currentUser()?.username === user.username
    );

    const passwordCtrl = this.userForm.get('password');
    const roleCtrl = this.userForm.get('role');
    const statusCtrl = this.userForm.get('isActive');

    if (!user) {
      passwordCtrl?.enable();
      passwordCtrl?.setValidators([Validators.required, Validators.minLength(6)]);
      roleCtrl?.enable();
      statusCtrl?.enable();

      this.userForm.reset({
        username: '',
        email: '',
        fullName: '',
        role: 'Administrator',
        password: '',
        isActive: true
      });
    } else {
      if (isSelf) {
        passwordCtrl?.enable();
        passwordCtrl?.setValidators([Validators.minLength(6)]);
      } else {
        passwordCtrl?.clearValidators();
        passwordCtrl?.disable();
      }

      if (this.authService.isSuperAdmin()) {
        roleCtrl?.enable();
        statusCtrl?.enable();
      } else {
        roleCtrl?.disable();
        statusCtrl?.disable();
      }

      this.userForm.reset();
      this.userForm.patchValue({
        username: user.username,
        email: user.email,
        fullName: user.fullName || '',
        role: user.role,
        password: '',
        isActive: user.isActive
      });
    }

    passwordCtrl?.updateValueAndValidity();
    roleCtrl?.updateValueAndValidity();
    statusCtrl?.updateValueAndValidity();

    setTimeout(() => {
      if (this.isOpen() && !!this.user()) {
        this.userForm.get('password')?.setValue('');
      }
    }, 100);
  }

  closeModal(): void {
    this.actionError.set(null);
    this.showPassword.set(false);
    this.closed.emit();
  }

  saveUser(): void {
    if (this.userForm.invalid) {
      this.userForm.markAllAsTouched();
      return;
    }

    this.isSaving.set(true);
    this.actionError.set(null);

    const formVal = this.userForm.getRawValue();
    const passwordVal = formVal.password ? String(formVal.password).trim() : '';

    const isEdit = this.isEditing();
    const isSelf = this.isEditingSelf();

    const shouldIncludePassword = isEdit
      ? (isSelf && passwordVal.length > 0)
      : passwordVal.length > 0;

    const payload: UserUpsertRequest = {
      username: formVal.username,
      email: formVal.email,
      fullName: formVal.fullName || '',
      role: formVal.role as UserRole,
      isActive: formVal.isActive ?? true,
      password: shouldIncludePassword ? passwordVal : undefined
    };

    const targetUser = this.user();
    if (isEdit && targetUser) {
      this.userService.updateUser(targetUser.id, payload).subscribe({
        next: (updatedUser) => {
          if (this.authService.currentUser()?.id === targetUser.id) {
            this.authService.updateCurrentUser(updatedUser);
          }
          this.isSaving.set(false);
          this.toastService.success(isSelf ? 'Profile updated successfully!' : 'User updated successfully!');
          this.saved.emit(updatedUser);
          this.closeModal();
        },
        error: (err) => {
          this.isSaving.set(false);
          this.actionError.set(err.error?.message || 'Failed to update user.');
        }
      });
    } else {
      this.userService.createUser(payload).subscribe({
        next: (newUser) => {
          this.isSaving.set(false);
          this.toastService.success('User created successfully!');
          this.saved.emit(newUser);
          this.closeModal();
        },
        error: (err) => {
          this.isSaving.set(false);
          this.actionError.set(err.error?.message || 'Failed to create user.');
        }
      });
    }
  }
}
