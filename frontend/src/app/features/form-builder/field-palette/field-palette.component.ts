import { Component, inject } from '@angular/core';
import { fieldPalette, FieldPaletteItem } from '../../../core/models/field-palette-item';
import { FormBuilderState } from '../../../core/services/form-builder-state';
import { CdkDrag, CdkDropList, CdkDragHandle } from '@angular/cdk/drag-drop';

@Component({
  imports: [CdkDrag, CdkDropList, CdkDragHandle],
  selector: 'app-field-palette',
  styleUrl: './field-palette.component.scss',
  templateUrl: './field-palette.component.html',
})
export class FieldPaletteComponent {
  fields = fieldPalette;
  private formBuilderState = inject(FormBuilderState);

  getFieldDropListIds(): string[] {
    return this.formBuilderState.form()?.sections.map((s) => `section-fields-${s.id}`) ?? [];
  }

  selectField(field: FieldPaletteItem): void {
    this.formBuilderState.addFieldToSelectedSection(field.type);
  }
}
