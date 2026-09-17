import { Component, inject } from '@angular/core';
import { FieldPaletteComponent } from './field-palette/field-palette.component';
import { FormCanvasComponent } from './form-canvas/form-canvas.component';
import { PropertiesPanelComponent } from './properties-panel/properties-panel.component';
import { FormBuilderState } from '../../core/services/form-builder-state';
import { Router } from '@angular/router';
import { CdkDropListGroup } from '@angular/cdk/drag-drop';

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
export class FormBuilderComponent {
  private readonly formBuilderState = inject(FormBuilderState);
  private readonly router = inject(Router);

  readonly form = this.formBuilderState.form;
  readonly canUndo = this.formBuilderState.canUndo;
  readonly canRedo = this.formBuilderState.canRedo;

  undo(): void {
    this.formBuilderState.undo();
  }

  redo(): void {
    this.formBuilderState.redo();
  }

  // openFormProperties(): void {
  //   this.formBuilderState.selectFormSettings();
  // }

  openPreview(): void {
    const currentForm = this.form();
    if (currentForm) {
      this.router.navigate(['/forms', currentForm.id, 'preview']);
    }
  }
}
