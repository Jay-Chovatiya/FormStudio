import { Component, OnInit, signal, computed, inject } from '@angular/core';
import { DatePipe } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { UserManagementService } from '../../core/services/user-management.service';
import { AuthService } from '../../core/services/auth.service';
import { User } from '../../core/models/user';
import { NavigationHistoryService } from '../../core/services/navigation-history.service';
import { ToastService } from '../../core/services/toast.service';
import { UserEditModalComponent } from '../../shared/components/user-edit-modal/user-edit-modal.component';

@Component({
  selector: 'app-user-management',
  imports: [DatePipe, FormsModule, UserEditModalComponent],
  templateUrl: './user-management.component.html',
  styleUrl: './user-management.component.scss'
})
export class UserManagementComponent implements OnInit {
  private readonly userService = inject(UserManagementService);
  readonly authService = inject(AuthService);
  private readonly router = inject(Router);
  private readonly navHistory = inject(NavigationHistoryService);
  private readonly toastService = inject(ToastService);

  readonly users = signal<User[]>([]);
  readonly loading = signal<boolean>(true);
  readonly error = signal<string | null>(null);

  readonly searchTerm = signal<string>('');
  readonly selectedRole = signal<string>('ALL');
  readonly selectedStatus = signal<string>('ALL');

  readonly isModalOpen = signal<boolean>(false);
  readonly selectedUser = signal<User | null>(null);

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
        this.error.set('Failed to load users from the server.');
        this.loading.set(false);
      }
    });
  }

  openCreateModal(): void {
    this.selectedUser.set(null);
    this.isModalOpen.set(true);
  }

  openEditModal(user: User): void {
    this.selectedUser.set(user);
    this.isModalOpen.set(true);
  }

  closeModal(): void {
    this.isModalOpen.set(false);
  }

  onUserSaved(savedUser: User): void {
    const isEdit = this.users().some((u) => u.id === savedUser.id);
    if (isEdit) {
      this.users.update((list) => list.map((u) => (u.id === savedUser.id ? savedUser : u)));
    } else {
      this.users.update((list) => [savedUser, ...list]);
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
