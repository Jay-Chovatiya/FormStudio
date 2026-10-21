import { Component, OnInit, inject, signal, DestroyRef, HostListener, ViewChild } from '@angular/core';
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
import { FormGroup, FormControl } from '@angular/forms';
import { ToastService } from '../../core/services/toast.service';
import { requiredTrimmedValidator } from '../../shared/validators/required-trimmed.validator';
import { identifierValidator } from '../../shared/validators/identifier.validator';
import { dateRangeValidator } from '../../shared/validators/date-range.validator';

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
  @ViewChild(PropertiesPanelComponent) propertiesPanel?: PropertiesPanelComponent;
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
              this.formBuilderState.resetHistory();
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
        this.formBuilderState.resetHistory();
      });
  }

  isEditMode(): boolean {
    const currentForm = this.form();
    return !!(currentForm && currentForm.id && typeof currentForm.id === 'number' && currentForm.id < 1000000000);
  }

  saveForm(): void {
    if (this.propertiesPanel?.hasErrors()) {
      this.toastService.error('Please resolve the errors displayed before saving.', 'Validation Error');
      return;
    }

    this.propertiesPanel?.applyActiveChanges();

    const currentForm = this.form();
    if (!currentForm) return;

    const validationError = this.validateFullForm(currentForm);
    if (validationError) {
      this.toastService.error(validationError, 'Validation Error');
      setTimeout(() => this.propertiesPanel?.hasErrors(), 0);
      return;
    }

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

  private validateFullForm(form: FormDefinition): string | null {
    // 1. Form metadata validation
    const metadataForm = new FormGroup(
      {
        name: new FormControl(form.name, { validators: [requiredTrimmedValidator] }),
        description: new FormControl(form.description, { validators: [requiredTrimmedValidator] }),
        code: new FormControl(form.code, { validators: [requiredTrimmedValidator, identifierValidator] }),
        startDate: new FormControl(form.startDate ?? ''),
        endDate: new FormControl(form.endDate ?? ''),
        submitButtonText: new FormControl(form.submitButtonText ?? '', { validators: [requiredTrimmedValidator] }),
        cancelButtonText: new FormControl(form.cancelButtonText ?? '', { validators: [requiredTrimmedValidator] }),
      },
      { validators: [dateRangeValidator] }
    );

    if (metadataForm.controls.name.invalid) {
      this.formBuilderState.selectFormSettings();
      return 'Form name is required.';
    }
    if (metadataForm.controls.description.invalid) {
      this.formBuilderState.selectFormSettings();
      return 'Form description is required.';
    }
    if (metadataForm.controls.code.hasError('requiredTrimmed')) {
      this.formBuilderState.selectFormSettings();
      return 'Form code is required.';
    }
    if (metadataForm.controls.code.hasError('invalidIdentifier')) {
      this.formBuilderState.selectFormSettings();
      return 'Form code must be a valid identifier (starts with letter, alphanumeric and underscores only).';
    }
    if (metadataForm.hasError('invalidDateRange')) {
      this.formBuilderState.selectFormSettings();
      return 'End date must be after start date.';
    }
    if (metadataForm.controls.submitButtonText.invalid) {
      this.formBuilderState.selectFormSettings();
      return 'Submit button text is required.';
    }
    if (metadataForm.controls.cancelButtonText.invalid) {
      this.formBuilderState.selectFormSettings();
      return 'Cancel button text is required.';
    }

    // 2. Sections validation (if present, validate them)
    if (form.sections && form.sections.length > 0) {
      const sectionTitles = new Set<string>();

      for (const section of form.sections) {
        const titleControl = new FormControl(section.title, { validators: [requiredTrimmedValidator] });
        if (titleControl.invalid) {
          this.formBuilderState.selectSection(section.guid ?? section.id);
          return 'Section title is required.';
        }

        const normalizedTitle = (section.title || '').trim().toLowerCase();
        if (sectionTitles.has(normalizedTitle)) {
          this.formBuilderState.selectSection(section.guid ?? section.id);
          return `Section title '${section.title}' must be unique.`;
        }
        sectionTitles.add(normalizedTitle);
      }

      // 3. Fields validation (for all fields in all sections)
      const fieldNames = new Set<string>();

      for (const section of form.sections) {
        for (const field of section.fields ?? []) {
          // Field Label
          const labelControl = new FormControl(field.label, { validators: [requiredTrimmedValidator] });
          if (labelControl.invalid) {
            this.formBuilderState.selectField(section.guid ?? section.id, field.guid ?? field.id);
            return `Field label is required for '${field.name || 'field'}'.`;
          }

          // Field Name
          const nameControl = new FormControl(field.name, {
            validators: [requiredTrimmedValidator, identifierValidator],
          });
          if (nameControl.hasError('requiredTrimmed')) {
            this.formBuilderState.selectField(section.guid ?? section.id, field.guid ?? field.id);
            return 'Field name is required.';
          }
          if (nameControl.hasError('invalidIdentifier')) {
            this.formBuilderState.selectField(section.guid ?? section.id, field.guid ?? field.id);
            return `Field name '${field.name}' is invalid. It must start with a letter and contain only alphanumeric characters and underscores.`;
          }

          // Unique Field Name across the entire form
          const normalizedFieldName = (field.name || '').trim().toLowerCase();
          if (fieldNames.has(normalizedFieldName)) {
            this.formBuilderState.selectField(section.guid ?? section.id, field.guid ?? field.id);
            return `Field name '${field.name}' already exists. Field names must be unique across the form.`;
          }
          fieldNames.add(normalizedFieldName);

          // File field validation
          if (field.type === 'File') {
            if (!field.allowedTypes || field.allowedTypes.length === 0) {
              const fieldLabel = field.label?.trim() || field.name?.trim() || 'File';
              this.formBuilderState.selectField(section.guid ?? section.id, field.guid ?? field.id);
              return `Please select at least one allowed file type for field '${fieldLabel}'.`;
            }
          }

          // Options validation (for fields with options)
          if (field.options && field.options.length > 0) {
            const optionValues = new Set<string>();
            for (const option of field.options) {
              const val = (option.value || '').trim();
              if (!val) {
                this.formBuilderState.selectField(section.guid ?? section.id, field.guid ?? field.id);
                return `Option value is required for field '${field.label || field.name}'.`;
              }
              const normalizedVal = val.toLowerCase();
              if (optionValues.has(normalizedVal)) {
                this.formBuilderState.selectField(section.guid ?? section.id, field.guid ?? field.id);
                return `Option values must be unique for field '${field.label || field.name}'.`;
              }
              optionValues.add(normalizedVal);
            }
          }
        }
      }
    }

    return null;
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
