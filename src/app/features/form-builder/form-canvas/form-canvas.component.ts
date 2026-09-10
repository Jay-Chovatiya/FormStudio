import { Component, inject, OnInit } from '@angular/core';
import { FormBuilderState } from '../../../core/services/form-builder-state';

@Component({
  imports: [],
  selector: 'app-form-canvas',
  styleUrl: './form-canvas.component.scss',
  templateUrl: './form-canvas.component.html',
})
export class FormCanvasComponent implements OnInit {
  private formBuilderState = inject(FormBuilderState);

  ngOnInit(): void {
    this.formBuilderState.createForm();
    this.formBuilderState.createSection();
  }

  form = this.formBuilderState.form;

  selectSection(sectionId: number): void {
    this.formBuilderState.selectSection(sectionId);
  }

  selectField(sectionId: number, fieldId: number) {
    this.formBuilderState.selectField(sectionId, fieldId);
  }

  isSectionSelected(sectionId: number): boolean {
    return this.formBuilderState.selectedSectionId() === sectionId;
  }

  isFieldSelected(fieldId: number): boolean{
    return this.formBuilderState.selectedFieldId() === fieldId;
  }

}
