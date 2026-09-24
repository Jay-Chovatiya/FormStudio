import { Component, OnInit, inject, signal, computed, DestroyRef } from '@angular/core';
import { DatePipe } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { FormService } from '../../core/services/form.service';
import { ResponseService } from '../../core/services/response.service';
import { NavigationHistoryService } from '../../core/services/navigation-history.service';
import { FormDefinition } from '../../core/models/form-definition';
import { FormSubmission } from '../../core/models/form-submission';
import { FormField } from '../../core/models/form-field';

@Component({
  selector: 'app-form-responses',
  standalone: true,
  imports: [FormsModule, DatePipe],
  templateUrl: './form-responses.component.html',
  styleUrl: './form-responses.component.scss'
})
export class FormResponsesComponent implements OnInit {
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly formService = inject(FormService);
  private readonly responseService = inject(ResponseService);
  private readonly navHistory = inject(NavigationHistoryService);
  private readonly destroyRef = inject(DestroyRef);

  form = signal<FormDefinition | null>(null);
  submissions = signal<FormSubmission[]>([]);
  loading = signal<boolean>(true);
  error = signal<string | null>(null);

  searchTerm = signal<string>('');
  sortOrder = signal<'desc' | 'asc'>('desc');

  currentPage = signal<number>(1);
  pageSize = signal<number>(10);
  readonly pageSizeOptions = [5, 10, 25, 50];

  selectedSubmission = signal<FormSubmission | null>(null);
  deletingSubmission = signal<FormSubmission | null>(null);

  allFields = computed<FormField[]>(() => {
    const f = this.form();
    if (!f || !f.sections) return [];
    return f.sections.flatMap((s) => s.fields || []);
  });

  tablePreviewFields = computed<FormField[]>(() => {
    return this.allFields().slice(0, 4);
  });

  filteredSubmissions = computed<FormSubmission[]>(() => {
    const query = this.searchTerm().toLowerCase().trim();
    const list = [...this.submissions()];
    const isAsc = this.sortOrder() === 'asc';

    list.sort((a, b) => {
      const timeA = a.submittedAt ? new Date(a.submittedAt).getTime() : 0;
      const timeB = b.submittedAt ? new Date(b.submittedAt).getTime() : 0;
      return isAsc ? timeA - timeB : timeB - timeA;
    });

    if (!query) return list;

    return list.filter((sub) => {
      if (String(sub.id).toLowerCase().includes(query)) return true;
      if (sub.submittedAt && sub.submittedAt.toLowerCase().includes(query)) return true;

      return sub.responses?.some((r) => {
        if (r.value === null || r.value === undefined) return false;
        if (Array.isArray(r.value)) {
          return r.value.some((v) => String(v).toLowerCase().includes(query));
        }
        return String(r.value).toLowerCase().includes(query);
      });
    });
  });

  totalPages = computed<number>(() => {
    const total = this.filteredSubmissions().length;
    const size = this.pageSize();
    return Math.max(1, Math.ceil(total / size));
  });

  paginatedSubmissions = computed<FormSubmission[]>(() => {
    const list = this.filteredSubmissions();
    const page = this.currentPage();
    const size = this.pageSize();
    const startIndex = (page - 1) * size;
    return list.slice(startIndex, startIndex + size);
  });

  paginationInfo = computed(() => {
    const total = this.filteredSubmissions().length;
    if (total === 0) return { start: 0, end: 0, total: 0 };
    const page = this.currentPage();
    const size = this.pageSize();
    const start = (page - 1) * size + 1;
    const end = Math.min(page * size, total);
    return { start, end, total };
  });

  ngOnInit(): void {
    this.route.paramMap
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe((params) => {
        const idParam = params.get('id');
        if (idParam) {
          const formId = Number(idParam);
          if (!isNaN(formId) && formId > 0) {
            this.loadFormData(formId);
          } else {
            this.error.set('Invalid Form ID provided in URL.');
            this.loading.set(false);
          }
        }
      });
  }

  loadFormData(formId: number): void {
    this.loading.set(true);
    this.error.set(null);

    this.formService.getFormById(formId).subscribe({
      next: (formDef) => {
        if (!formDef) {
          this.error.set('Form definition not found.');
          this.loading.set(false);
          return;
        }
        this.form.set(formDef);
        this.loadSubmissions(formId);
      },
      error: () => {
        this.error.set('Failed to load form details.');
        this.loading.set(false);
      }
    });
  }

  loadSubmissions(formId: number): void {
    this.responseService.getSubmissions(formId).subscribe({
      next: (data) => {
        this.submissions.set(data || []);
        this.loading.set(false);
      },
      error: (err) => {
        console.error('Failed to load submissions:', err);
        this.error.set('Failed to load form submissions.');
        this.loading.set(false);
      }
    });
  }

  getFieldValue(sub: FormSubmission, fieldId: number): string {
    const resp = sub.responses?.find((r) => r.fieldId === fieldId || String(r.fieldId) === String(fieldId));
    if (!resp || resp.value === null || resp.value === undefined || resp.value === '') {
      return '—';
    }
    if (Array.isArray(resp.value)) {
      return resp.value.join(', ');
    }
    if (typeof resp.value === 'boolean') {
      return resp.value ? 'Yes' : 'No';
    }
    return String(resp.value);
  }

  getDetailedValue(sub: FormSubmission, field: FormField): { display: string; isPlaceholder: boolean } {
    const resp = sub.responses?.find((r) => r.fieldId === field.id || String(r.fieldId) === String(field.id));
    if (!resp || resp.value === null || resp.value === undefined || resp.value === '') {
      return { display: '— (No answer provided)', isPlaceholder: true };
    }
    if (Array.isArray(resp.value)) {
      return { display: resp.value.join(', '), isPlaceholder: false };
    }
    if (typeof resp.value === 'boolean') {
      return { display: resp.value ? 'Checked / Yes' : 'Unchecked / No', isPlaceholder: false };
    }
    return { display: String(resp.value), isPlaceholder: false };
  }

  onExportCsv(): void {
    const currentForm = this.form();
    const currentSubmissions = this.filteredSubmissions();
    if (!currentForm) return;

    if (currentSubmissions.length === 0) {
      alert('No submissions available to export.');
      return;
    }

    this.responseService.exportToCsv(currentForm, currentSubmissions);
  }

  onViewDetails(sub: FormSubmission): void {
    this.selectedSubmission.set(sub);
  }

  closeDetails(): void {
    this.selectedSubmission.set(null);
  }

  confirmDelete(sub: FormSubmission, event?: Event): void {
    if (event) event.stopPropagation();
    this.deletingSubmission.set(sub);
  }

  cancelDelete(): void {
    this.deletingSubmission.set(null);
  }

  executeDelete(): void {
    const sub = this.deletingSubmission();
    const formDef = this.form();
    if (!sub || !formDef || sub.id === undefined) return;

    this.responseService.deleteSubmission(formDef.id, sub.id).subscribe({
      next: (success) => {
        if (success) {
          this.submissions.update((list) => list.filter((s) => s.id !== sub.id));
          if (this.selectedSubmission()?.id === sub.id) {
            this.selectedSubmission.set(null);
          }
          this.deletingSubmission.set(null);
        }
      },
      error: (err) => {
        console.error('Failed to delete submission:', err);
        alert('Failed to delete submission. Please try again.');
        this.deletingSubmission.set(null);
      }
    });
  }

  goToPage(page: number): void {
    if (page >= 1 && page <= this.totalPages()) {
      this.currentPage.set(page);
    }
  }

  onPageSizeChange(newSize: number): void {
    this.pageSize.set(Number(newSize));
    this.currentPage.set(1);
  }

  toggleSort(): void {
    this.sortOrder.update((curr) => (curr === 'desc' ? 'asc' : 'desc'));
  }

  backToList(): void {
    this.navHistory.back('/forms');
  }

  openFillForm(): void {
    const f = this.form();
    if (f) {
      this.router.navigate(['/forms', f.id, 'fill']);
    }
  }

  openPreview(): void {
    const f = this.form();
    if (f) {
      this.router.navigate(['/forms', f.id, 'preview']);
    }
  }

  openBuilder(): void {
    const f = this.form();
    if (f) {
      this.router.navigate(['/form-builder'], { queryParams: { id: f.id } });
    }
  }
}
