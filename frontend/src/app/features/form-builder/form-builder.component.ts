import { Component, OnInit, inject, signal, DestroyRef } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { FieldPaletteComponent } from './field-palette/field-palette.component';
import { FormCanvasComponent } from './form-canvas/form-canvas.component';
import { PropertiesPanelComponent } from './properties-panel/properties-panel.component';
import { FormBuilderState } from '../../core/services/form-builder-state';
import { FormService } from '../../core/services/form.service';
import { ActivatedRoute, Router } from '@angular/router';
import { CdkDropListGroup } from '@angular/cdk/drag-drop';
import { FormDefinition } from '../../core/models/form-definition';

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

  readonly form = this.formBuilderState.form;
  readonly canUndo = this.formBuilderState.canUndo;
  readonly canRedo = this.formBuilderState.canRedo;
  saving = signal<boolean>(false);

  ngOnInit(): void {
    this.route.queryParamMap
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe((params) => {
        const paramId = params.get('id');
        if (paramId) {
          const id = Number(paramId);
          if (!isNaN(id) && id > 0) {
            this.formService.getFormById(id).subscribe({
              next: (formDef: FormDefinition | null) => {
                if (formDef) {
                  this.formBuilderState.setForm(formDef);
                }
              },
              error: (err: any) => {
                console.error('Error fetching form details:', err);
              }
            });
          }
        } else {
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
          alert('Form updated successfully!');
          if (savedForm) this.formBuilderState.setForm(savedForm);
        },
        error: (_err: any) => {
          this.saving.set(false);
          alert('Failed to save form changes.');
        }
      });
    } else {
      this.formService.createForm(currentForm).subscribe({
        next: (createdForm: FormDefinition) => {
          this.saving.set(false);
          alert('New form created successfully!');
          if (createdForm) {
            this.formBuilderState.setForm(createdForm);
            this.router.navigate(['/form-builder'], { queryParams: { id: createdForm.id } });
          }
        },
        error: (_err: any) => {
          this.saving.set(false);
          alert('Failed to create form.');
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

  backToList(): void {
    this.router.navigate(['/forms']);
  }
}
