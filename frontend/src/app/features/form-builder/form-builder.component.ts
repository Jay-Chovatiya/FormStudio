import { Component, OnInit, inject, signal, DestroyRef, HostListener } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { FieldPaletteComponent } from './field-palette/field-palette.component';
import { FormCanvasComponent } from './form-canvas/form-canvas.component';
import { PropertiesPanelComponent } from './properties-panel/properties-panel.component';
import { FormBuilderState } from '../../core/services/form-builder-state';
import { FormService } from '../../core/services/form.service';
import { ActivatedRoute, Router } from '@angular/router';
import { CdkDropListGroup } from '@angular/cdk/drag-drop';
import { FormDefinition } from '../../core/models/form-definition';
import { NavigationHistoryService } from '../../core/services/navigation-history.service';
import { ToastService } from '../../core/services/toast.service';

@Component({
  imports: [
    FieldPaletteComponent,
    FormCanvasComponent,
    PropertiesPanelComponent,
    CdkDropListGroup,
  ],
  selector: 'app-form-builder',
  styleUrl: './form-builder.component.scss',
  templateUrl: './form-builder.component.html',
})
export class FormBuilderComponent implements OnInit {
  private readonly formBuilderState = inject(FormBuilderState);
  private readonly formService = inject(FormService);
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly destroyRef = inject(DestroyRef);
  private readonly navHistory = inject(NavigationHistoryService);
  private readonly toastService = inject(ToastService);

  readonly form = this.formBuilderState.form;
  readonly canUndo = this.formBuilderState.canUndo;
  readonly canRedo = this.formBuilderState.canRedo;
  saving = signal<boolean>(false);
  publishing = signal<boolean>(false);
  readonly isMoreMenuOpen = signal<boolean>(false);
  readonly mobileView = signal<'palette' | 'canvas' | 'properties'>('canvas');

  setMobileView(view: 'palette' | 'canvas' | 'properties'): void {
    this.mobileView.set(view);
  }

  ngOnInit(): void {
    this.route.queryParamMap
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe((params) => {
        const currentForm = this.formBuilderState.form();

        if (history.state?.fromPreview && currentForm) {
          return;
        }

        if (history.state?.createNew) {
          this.formBuilderState.createNewForm();
          return;
        }

        const paramId = params.get('id');
        if (paramId) {
          const id = Number(paramId);
          if (!isNaN(id) && id > 0) {
            if (currentForm && (currentForm.id === id || String(currentForm.id) === String(id))) {
              return;
            }

            this.formService.getFormById(id).subscribe({
              next: (formDef: FormDefinition | null) => {
                if (formDef) {
                  this.formBuilderState.setForm(formDef);
                }
              },
              error: (err: unknown) => {
                console.error('Error fetching form details:', err);
              }
            });
            return;
          }
        }

        if (!currentForm) {
          this.formBuilderState.createNewForm();
        }
      });
  }

  isEditMode(): boolean {
    const currentForm = this.form();
    return !!(currentForm && currentForm.id && typeof currentForm.id === 'number' && currentForm.id < 1000000000);
  }

  saveForm(): void {
    const currentForm = this.form();
    if (!currentForm) return;

    this.saving.set(true);

    if (currentForm.id && typeof currentForm.id === 'number' && currentForm.id < 1000000000) {
      this.formService.updateForm(currentForm.id, currentForm).subscribe({
        next: (savedForm: FormDefinition) => {
          this.saving.set(false);
          this.toastService.success('Form changes saved successfully!');
          if (savedForm) this.formBuilderState.setForm(savedForm);
        },
        error: () => {
          this.saving.set(false);
        }
      });
    } else {
      this.formService.createForm(currentForm).subscribe({
        next: (createdForm: FormDefinition) => {
          this.saving.set(false);
          this.toastService.success('New form created successfully!');
          if (createdForm) {
            this.formBuilderState.setForm(createdForm);
            this.router.navigate(['/form-builder'], { queryParams: { id: createdForm.id } });
          }
        },
        error: () => {
          this.saving.set(false);
        }
      });
    }
  }


  undo(): void {
    this.formBuilderState.undo();
  }

  redo(): void {
    this.formBuilderState.redo();
  }

  openPreview(): void {
    const currentForm = this.form();
    if (currentForm) {
      this.router.navigate(['/forms', currentForm.id, 'preview']);
    }
  }

  openResponses(): void {
    const currentForm = this.form();
    if (currentForm && currentForm.id) {
      this.router.navigate(['/forms', currentForm.id, 'responses']);
    }
  }

  togglePublishStatus(): void {
    const currentForm = this.form();
    if (!currentForm?.id) {
      this.toastService.warning('Please save the form before publishing.');
      return;
    }

    const isPublished = currentForm.status === 'Published';
    this.publishing.set(true);

    const action$ = isPublished
      ? this.formService.unpublishForm(currentForm.id)
      : this.formService.publishForm(currentForm.id);

    action$.subscribe({
      next: (updatedForm: FormDefinition | null) => {
        this.publishing.set(false);
        const nextStatus = isPublished ? 'Unpublished' : 'Published';
        this.formBuilderState.updateFormMetadata({
          status: updatedForm?.status || nextStatus,
          updatedAt: updatedForm?.updatedAt || new Date().toISOString()
        });
        this.toastService.success(`Form successfully ${isPublished ? 'unpublished' : 'published'}!`);
      },
      error: () => {
        this.publishing.set(false);
      }
    });
  }

  toggleMoreMenu(event?: Event): void {
    if (event) {
      event.stopPropagation();
    }
    this.isMoreMenuOpen.update((v) => !v);
  }

  closeMoreMenu(): void {
    this.isMoreMenuOpen.set(false);
  }

  openFormSettings(): void {
    this.formBuilderState.selectFormSettings();
    this.setMobileView('properties');
    this.closeMoreMenu();
  }

  @HostListener('document:click', ['$event'])
  onDocumentClick(event: MouseEvent): void {
    if (!this.isMoreMenuOpen()) return;
    const target = event.target as HTMLElement | null;
    if (!target?.closest('.mobile-more-container')) {
      this.closeMoreMenu();
    }
  }

  @HostListener('document:keydown.escape')
  onEscape(): void {
    this.closeMoreMenu();
  }

  backToList(): void {
    this.navHistory.back('/forms');
  }
}
