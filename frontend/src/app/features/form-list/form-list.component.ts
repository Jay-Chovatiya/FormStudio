import { Component, OnInit, signal, computed, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router, RouterModule } from '@angular/router';
import { FormService } from '../../core/services/form.service';
import { FormDefinition } from '../../core/models/form-definition';
import { FormSection } from '../../core/models/form-section';
import { FormStatus } from '../../core/models/form-status';

@Component({
  selector: 'app-form-list',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterModule],
  templateUrl: './form-list.component.html',
  styleUrl: './form-list.component.scss'
})
export class FormListComponent implements OnInit {
  private formService = inject(FormService);
  private router = inject(Router);

  forms = signal<FormDefinition[]>([]);
  loading = signal<boolean>(true);
  error = signal<string | null>(null);

  searchTerm = signal<string>('');
  selectedStatus = signal<string>('ALL');

  allowedStatuses: FormStatus[] = ['Draft', 'Published', 'Unpublished', 'Archived'];

  filteredForms = computed(() => {
    const search = this.searchTerm().toLowerCase().trim();
    const status = this.selectedStatus();

    return this.forms().filter(form => {
      const matchesSearch = !search || 
        form.name.toLowerCase().includes(search) || 
        form.code.toLowerCase().includes(search) ||
        (form.category && form.category.toLowerCase().includes(search)) ||
        (form.description && form.description.toLowerCase().includes(search));

      const matchesStatus = status === 'ALL' || form.status.toUpperCase() === status.toUpperCase();

      return matchesSearch && matchesStatus;
    });
  });

  ngOnInit(): void {
    this.loadForms();
  }

  loadForms(): void {
    this.loading.set(true);
    this.error.set(null);

    this.formService.getForms().subscribe({
      next: (data: FormDefinition[]) => {
        this.forms.set(data);
        this.loading.set(false);
      },
      error: (err: any) => {
        console.error('Failed to load forms:', err);
        this.error.set('Failed to connect to backend server at http://localhost:5000. Please ensure the backend is running.');
        this.loading.set(false);
      }
    });
  }

  onStatusChange(form: FormDefinition, newStatus: string): void {
    if (!form.id || form.status === newStatus) return;
    const typedStatus = newStatus as FormStatus;

    this.formService.updateFormStatus(form.id, typedStatus).subscribe({
      next: (updatedForm: FormDefinition | null) => {
        if (updatedForm) {
          this.forms.update((list: FormDefinition[]) => list.map(f => f.id === form.id ? { ...f, status: typedStatus } : f));
        }
      },
      error: (err: any) => {
        alert(`Failed to update status: ${err.message || 'Error occurred'}`);
      }
    });
  }

  onDuplicate(form: FormDefinition, event: Event): void {
    event.stopPropagation();
    if (!form.id) return;

    this.formService.duplicateForm(form.id).subscribe({
      next: (duplicated: FormDefinition | null) => {
        if (duplicated) {
          this.loadForms();
        }
      },
      error: (_err: any) => {
        alert('Failed to duplicate form.');
      }
    });
  }

  onDelete(form: FormDefinition, event: Event): void {
    event.stopPropagation();
    if (!form.id) return;

    if (confirm(`Are you sure you want to delete form "${form.name}"?`)) {
      this.formService.deleteForm(form.id).subscribe({
        next: (success: boolean) => {
          if (success) {
            this.forms.update((list: FormDefinition[]) => list.filter(f => f.id !== form.id));
          }
        },
        error: () => {
          alert('Failed to delete form.');
        }
      });
    }
  }

  onCreateForm(): void {
    this.router.navigate(['/form-builder'], { state: { createNew: true } });
  }

  onEditForm(form: FormDefinition): void {
    this.router.navigate(['/form-builder'], { queryParams: { id: form.id } });
  }

  onPreviewForm(form: FormDefinition, event: Event): void {
    event.stopPropagation();
    this.router.navigate(['/forms', form.id, 'preview']);
  }

  getStatusBadgeClass(status: string): string {
    switch (status?.toUpperCase()) {
      case 'PUBLISHED': return 'badge-published';
      case 'DRAFT': return 'badge-draft';
      case 'UNPUBLISHED': return 'badge-unpublished';
      case 'ARCHIVED': return 'badge-archived';
      default: return 'badge-default';
    }
  }

  getTotalFields(form: FormDefinition): number {
    return form.sections ? form.sections.reduce((acc: number, sec: FormSection) => acc + (sec.fields ? sec.fields.length : 0), 0) : 0;
  }
}
