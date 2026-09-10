import { Component, inject } from '@angular/core';
import { fieldPalette, FieldPaletteItem } from '../../../core/models/field-palette-item';
import { FormBuilderState } from '../../../core/services/form-builder-state';

@Component({
  imports: [],
  selector: 'app-field-palette',
  styleUrl: './field-palette.component.scss',
  templateUrl: './field-palette.component.html',
})
export class FieldPaletteComponent {
  fields = fieldPalette;
  private formBuilderState = inject(FormBuilderState);

  selectField(field: FieldPaletteItem): void {
    const res = this.formBuilderState.addFieldToSelectedSection(field.type);
  }
}
