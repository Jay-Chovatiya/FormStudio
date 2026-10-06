import {
  Component,
  inject,
  input,
  signal,
  computed,
  OnInit,
  DestroyRef,
  effect,
  untracked,
} from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { ActivatedRoute } from '@angular/router';
import { TitleCasePipe } from '@angular/common';
import {
  FormGroup,
  FormControl,
  ReactiveFormsModule,
  Validators,
  ValidatorFn,
  AbstractControl,
} from '@angular/forms';
import { FormField } from '../../../core/models/form-field';
import { FieldValidation } from '../../../core/models/field-validation';
import { FieldTypes } from '../../../core/models/field-types';
import { FormResponse } from '../../../core/models/form-response';
import { FormSubmission } from '../../../core/models/form-submission';
import { FormDefinition } from '../../../core/models/form-definition';
import { FormService } from '../../../core/services/form.service';
import { ResponseService } from '../../../core/services/response.service';
import { NavigationHistoryService } from '../../../core/services/navigation-history.service';
import { DatePickerComponent } from '../../../shared/components/date-picker/date-picker.component';
import { emailValidator } from '../../../core/utils/regex.constants';
import { ToastService } from '../../../core/services/toast.service';

@Component({
  imports: [ReactiveFormsModule, TitleCasePipe, DatePickerComponent],
  selector: 'app-dynamic-form',
  styleUrl: './dynamic-form.component.scss',
  templateUrl: './dynamic-form.component.html',
})
export class DynamicFormComponent implements OnInit {
  readonly formDefinition = input<FormDefinition | null>(null);
  readonly isPreview = input<boolean>(false);

  private readonly formService = inject(FormService);
  private readonly responseService = inject(ResponseService);
  private readonly navHistory = inject(NavigationHistoryService);
  private readonly route = inject(ActivatedRoute);
  private readonly destroyRef = inject(DestroyRef);
  private readonly toastService = inject(ToastService);

  readonly resolvedForm = signal<FormDefinition | null>(null);
  readonly loading = signal<boolean>(false);
  readonly error = signal<string | null>(null);
  readonly isSubmitting = signal<boolean>(false);
  readonly submitted = signal<boolean>(false);
  readonly draftSaved = signal<boolean>(false);
  readonly hasRestoredDraft = signal<boolean>(false);
  readonly selectedFilesMap = signal<Record<string, File[]>>({});

  readonly activeForm = computed<FormDefinition | null>(() => {
    return this.formDefinition() || this.resolvedForm();
  });

  form = new FormGroup<Record<string, AbstractControl>>({});

  readonly statusWarning = computed<{ message: string; isBlocked: boolean } | null>(() => {
    if (this.isPreview()) return null;
    const f = this.activeForm();
    if (!f) return null;

    if (f.status && f.status !== 'Published') {
      return {
        message: `This form is currently in "${f.status}" status and is not accepting responses.`,
        isBlocked: true,
      };
    }

    const now = Date.now();
    if (f.startDate) {
      const start = new Date(f.startDate).getTime();
      if (!isNaN(start) && now < start) {
        return {
          message: `This form is scheduled to open on ${new Date(f.startDate).toLocaleDateString()}. Submissions are not yet open.`,
          isBlocked: true,
        };
      }
    }

    if (f.endDate) {
      const end = new Date(f.endDate).getTime();
      if (!isNaN(end) && now > end) {
        return {
          message: `This form closed on ${new Date(f.endDate).toLocaleDateString()}. Submissions are no longer accepted.`,
          isBlocked: true,
        };
      }
    }

    return null;
  });

  private prevFormId: number | null = null;
  private readonly formInputEffect = effect(() => {
    const inputDef = this.formDefinition();
    if (inputDef && inputDef.id !== this.prevFormId) {
      this.prevFormId = inputDef.id;
      untracked(() => {
        this.createForm(inputDef);
      });
    }
  });

  ngOnInit(): void {
    const directInput = this.formDefinition();
    if (directInput) {
      this.createForm(directInput);
      if (directInput.allowSaveAsDraft && !this.isPreview()) {
        this.checkForSavedDraft(directInput.id);
      }
      return;
    }

    this.route.paramMap
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe((params) => {
        const code = params.get('code');
        if (code) {
          this.loadFormByCode(code.trim());
        } else {
          this.error.set('Invalid form URL.');
        }
      });
  }

  loadFormByCode(code: string): void {
    this.loading.set(true);
    this.error.set(null);

    this.formService.getFormByCode(code).subscribe({
      next: (formDef) => {
        this.loading.set(false);
        if (formDef) {
          this.resolvedForm.set(formDef);
          this.createForm(formDef);
          if (formDef.allowSaveAsDraft && !this.isPreview()) {
            this.checkForSavedDraft(formDef.id);
          }
        } else {
          this.error.set('Invalid form URL or form is not currently active.');
        }
      },
      error: (err) => {
        this.loading.set(false);
        console.error('Failed to load form definition:', err);
        this.error.set(err?.message || 'Invalid form URL or form is not currently active.');
      },
    });
  }

  createForm(formDefinition: FormDefinition): void {
    this.form = new FormGroup<Record<string, AbstractControl>>({});
    formDefinition.sections.forEach((section) => {
      if (!section.visibility) return;
      section.fields.forEach((field) => {
        if (!field.visibility) return;
        const initialValue =
          field.type === 'Checkbox'
            ? field.default === true || field.default === 'true'
            : field.type === 'File'
            ? null
            : field.default ?? '';
        this.form.addControl(
          field.name,
          new FormControl(
            initialValue,
            this.createValidators(field.validations ?? [], field.type)
          ),
        );
      });
    });
  }

  createValidators(validations: FieldValidation[], fieldType?: FieldTypes): ValidatorFn[] {
    const validators: ValidatorFn[] = [];
    validations.forEach((validation) => {
      switch (validation.type) {
        case 'required':
          validators.push(fieldType === 'Checkbox' ? Validators.requiredTrue : Validators.required);
          break;
        case 'email':
          validators.push(emailValidator);
          break;
        case 'minLength':
          validators.push(Validators.minLength(validation.value));
          break;
        case 'maxLength':
          validators.push(Validators.maxLength(validation.value));
          break;
        case 'minValue':
          validators.push(Validators.min(validation.value));
          break;
        case 'maxValue':
          validators.push(Validators.max(validation.value));
          break;
        case 'pattern':
          validators.push(Validators.pattern(validation.value));
          break;
      }
    });

    if (fieldType === 'Email' && !validations.some((v) => v.type === 'email')) {
      validators.push(emailValidator);
    }

    return validators;
  }

  getControl(fieldName: string): AbstractControl | null {
    return this.form.get(fieldName);
  }

  getInputType(fieldType: FieldTypes): string {
    switch (fieldType) {
      case 'Email':
        return 'email';
      case 'Number':
        return 'number';
      case 'Textbox':
      default:
        return 'text';
    }
  }

  isFieldRequired(field: FormField): boolean {
    return field.validations?.some((v) => v.type === 'required') ?? false;
  }

  checkForSavedDraft(formId: number): void {
    if (typeof localStorage === 'undefined') return;
    const rawDraft = localStorage.getItem(`form_draft_${formId}`);
    if (rawDraft) {
      try {
        const draftValues = JSON.parse(rawDraft);
        this.form.patchValue(draftValues);
        this.hasRestoredDraft.set(true);
      } catch (e) {
        console.error('Error parsing stored draft:', e);
      }
    }
  }

  saveAsDraft(): void {
    const f = this.activeForm();
    if (!f || !f.id) return;
    if (typeof localStorage !== 'undefined') {
      localStorage.setItem(`form_draft_${f.id}`, JSON.stringify(this.form.value));
      this.draftSaved.set(true);
      setTimeout(() => this.draftSaved.set(false), 3500);
    }
  }

  discardDraft(): void {
    const f = this.activeForm();
    if (!f || !f.id) return;
    if (typeof localStorage !== 'undefined') {
      localStorage.removeItem(`form_draft_${f.id}`);
    }
    this.hasRestoredDraft.set(false);
    this.createForm(f);
  }

  resetForm(): void {
    const formDef = this.activeForm();
    this.selectedFilesMap.set({});
    if (formDef) {
      this.createForm(formDef);
    } else {
      this.form.reset();
    }
    this.submitted.set(false);
  }

  getSelectedFiles(fieldName: string): File[] {
    return this.selectedFilesMap()[fieldName] ?? [];
  }

  getAcceptedExtensions(field: FormField): string {
    const allowed = field.allowedTypes;
    if (allowed && allowed.length > 0) {
      return allowed.map((t) => t.extension.toLowerCase()).join(',');
    }
    return '';
  }

  getFileConstraintsHint(field: FormField): string {
    const maxMb = (field.maxSizeInBytes && field.maxSizeInBytes > 0) ? Math.round(field.maxSizeInBytes / (1024 * 1024)) : 5;
    const extensions = field.allowedTypes?.length
      ? field.allowedTypes.map((t) => t.extension.toUpperCase()).join(', ')
      : 'None';
    const multiple = field.multiple ? ` • Up to ${field.maxFiles || 1} files` : '';
    return `Max ${maxMb}MB per file • Formats: ${extensions}${multiple}`;
  }

  formatBytes(bytes: number): string {
    if (bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i];
  }

  onFileInputChange(field: FormField, event: Event): void {
    const input = event.target as HTMLInputElement;
    if (input.files) {
      this.handleFiles(field, Array.from(input.files));
      input.value = '';
    }
  }

  onFileDrop(field: FormField, event: DragEvent): void {
    event.preventDefault();
    if (event.dataTransfer?.files) {
      this.handleFiles(field, Array.from(event.dataTransfer.files));
    }
  }

  private handleFiles(field: FormField, newFiles: File[]): void {
    const control = this.getControl(field.name);
    if (!control) return;

    control.markAsTouched();

    const isMultiple = field.multiple ?? false;
    const maxFiles = isMultiple ? (field.maxFiles || 1) : 1;
    const maxSize = (field.maxSizeInBytes && field.maxSizeInBytes > 0) ? field.maxSizeInBytes : 5242880;
    const allowedExts = field.allowedTypes?.length
      ? field.allowedTypes.map((t) => t.extension.toLowerCase())
      : [];

    // if (allowedExts.length === 0) {
    //   control.setErrors({ fileType: 'No allowed file types configured for this field.' });
    //   return;
    // }

    const currentFiles = isMultiple ? (this.selectedFilesMap()[field.name] ?? []) : [];
    const combinedFiles = isMultiple ? [...currentFiles, ...newFiles] : newFiles.slice(0, 1);

    // if (combinedFiles.length > maxFiles) {
    //   control.setErrors({ maxFiles: `Maximum of ${maxFiles} file(s) allowed.` });
    //   return;
    // }

    // for (const f of combinedFiles) {
    //   const ext = '.' + f.name.split('.').pop()?.toLowerCase();
    //   if (!allowedExts.includes(ext)) {
    //     control.setErrors({ fileType: `File "${f.name}" has an unsupported format. Allowed: ${allowedExts.join(', ')}` });
    //     return;
    //   }
    //   if (f.size > maxSize) {
    //     const mb = Math.round(maxSize / (1024 * 1024));
    //     control.setErrors({ fileSize: `File "${f.name}" exceeds the ${mb}MB size limit.` });
    //     return;
    //   }
    // }

    control.setErrors(null);

    this.selectedFilesMap.update((map) => ({
      ...map,
      [field.name]: combinedFiles,
    }));

    if (combinedFiles.length === 0) {
      control.setValue(null);
    } else {
      const summary = combinedFiles.map((f) => f.name).join(', ');
      control.setValue(summary);
    }
    control.updateValueAndValidity();
  }

  removeSelectedFile(field: FormField, index: number): void {
    const control = this.form.get(field.name);
    const currentFiles = [...(this.selectedFilesMap()[field.name] ?? [])];
    currentFiles.splice(index, 1);

    this.selectedFilesMap.update((map) => ({
      ...map,
      [field.name]: currentFiles,
    }));

    if (control) {
      control.markAsTouched();
      control.setErrors(null);
      if (currentFiles.length === 0) {
        control.setValue(null);
      } else {
        control.setValue(currentFiles.map((f) => f.name).join(', '));
      }
      control.updateValueAndValidity();
    }
  }

  submit(): void {
    const warning = this.statusWarning();
    if (warning && warning.isBlocked) {
      this.toastService.warning(warning.message);
      return;
    }

    this.form.markAllAsTouched();
    if (this.form.invalid) {
      if (typeof document !== 'undefined') {
        const firstInvalid = document.querySelector('.ng-invalid:not(form)');
        if (firstInvalid) {
          if (typeof firstInvalid.scrollIntoView === 'function') {
            firstInvalid.scrollIntoView({ behavior: 'smooth', block: 'center' });
          }
          (firstInvalid as HTMLElement).focus?.();
        }
      }
      return;
    }

    const formDefinition = this.activeForm();
    if (!formDefinition) return;

    const responses: FormResponse[] = formDefinition.sections
      .flatMap((section) => section.fields)
      .map((field) => ({
        fieldId: field.id,
        value: this.getResponseValue(field),
      }));

    const payload: FormSubmission = {
      formId: formDefinition.id,
      responses: responses,
    };

    if (this.isPreview()) {
      this.submitted.set(true);
      return;
    }

    this.isSubmitting.set(true);
    this.responseService.submitForm(formDefinition.code, payload).subscribe({
      next: () => {
        this.isSubmitting.set(false);
        this.submitted.set(true);
        if (typeof localStorage !== 'undefined') {
          localStorage.removeItem(`form_draft_${formDefinition.id}`);
        }
        this.toastService.success('Form response submitted successfully!');
      },
      error: () => {
        this.isSubmitting.set(false);
      },
    });
  }

  getResponseValue(field: FormField): string | number | boolean | null {
    const value = this.form.get(field.name)?.value;

    if (value === null || value === undefined || value === '' || Number.isNaN(value)) {
      return null;
    }

    switch (field.type) {
      case 'Number':
        return Number(value);
      default:
        return value;
    }
  }

  backToForms(): void {
    this.navHistory.back('/forms');
  }
}
