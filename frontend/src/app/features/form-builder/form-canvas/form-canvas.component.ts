import { Component, inject, OnInit } from '@angular/core';
import { FormBuilderState } from '../../../core/services/form-builder-state';
import { CdkDrag, CdkDropList, CdkDragDrop, CdkDragHandle, CdkDropListGroup } from '@angular/cdk/drag-drop';
import { FormSection } from '../../../core/models/form-section';
import { FormField } from '../../../core/models/form-field';
import { Router } from '@angular/router';

@Component({
  imports: [CdkDrag, CdkDropList, CdkDropListGroup, CdkDragHandle],
  selector: 'app-form-canvas',
  styleUrl: './form-canvas.component.scss',
  templateUrl: './form-canvas.component.html',
})
export class FormCanvasComponent implements OnInit {
  private formBuilderState = inject(FormBuilderState);
  private readonly router = inject(Router);

  ngOnInit(): void {
    if (!this.formBuilderState.form()) {
      this.formBuilderState.createNewForm('Sample Form', 'Dynamic form builder canvas');
    }
  }

  form = this.formBuilderState.form;
  canUndo = this.formBuilderState.canUndo;
  canRedo = this.formBuilderState.canRedo;

  openFormProperties(): void {
    this.formBuilderState.selectFormSettings();
  }

  selectSection(sectionId: number): void {
    this.formBuilderState.selectSection(sectionId);
  }

  selectField(sectionId: number, fieldId: number): void {
    this.formBuilderState.selectField(sectionId, fieldId);
  }

  isSectionSelected(sectionId: number): boolean {
    return this.formBuilderState.selectedSectionId() === sectionId;
  }

  isFieldSelected(fieldId: number): boolean {
    return this.formBuilderState.selectedFieldId() === fieldId;
  }

  getFieldDropListId(sectionId: number): string {
    return `section-fields-${sectionId}`;
  }

  getFieldDropListIds(): string[] {
    const sectionIds = this.form()?.sections.map((section) => this.getFieldDropListId(section.id)) ?? [];
    return ['palette-drop-list', ...sectionIds];
  }

  addSection(): void {
    this.formBuilderState.addSection();
  }

  removeSection(sectionId: number): void {
    this.formBuilderState.removeSection(sectionId);
  }

  removeField(fieldId: number): void {
    this.formBuilderState.removeField(fieldId);
  }

  dropSection(event: CdkDragDrop<FormSection[]>): void {
    if (event.previousIndex === event.currentIndex) return;
    this.formBuilderState.moveSection(event.previousIndex, event.currentIndex);
  }

  dropField(event: CdkDragDrop<any>): void {
    if (
      event.previousContainer === event.container &&
      event.previousIndex === event.currentIndex
    ) {
      return;
    }

    // Check if dragged from field palette
    if (
      event.previousContainer.id === 'palette-drop-list' ||
      (event.item.data?.type && !event.item.data?.id)
    ) {
      const fieldType = event.item.data.type;
      const targetSectionId = event.container.data;
      this.formBuilderState.addFieldToSection(targetSectionId, fieldType, event.currentIndex);
      return;
    }

    // Moving field between or within sections
    const fromSectionId = event.previousContainer.data;
    const toSectionId = event.container.data;

    this.formBuilderState.moveField(
      fromSectionId,
      toSectionId,
      event.previousIndex,
      event.currentIndex,
    );
  }

  undo(): void {
    this.formBuilderState.undo();
  }

  redo(): void {
    this.formBuilderState.redo();
  }

  openPreview(): void {
    const currentForm = this.form();

    if (!currentForm) return;

    this.router.navigate(['/forms', currentForm.id, 'preview']);
  }

  isFieldRequired(field: FormField): boolean {
    return field.validations?.some((v) => v.type === 'required') ?? false;
  }
}
