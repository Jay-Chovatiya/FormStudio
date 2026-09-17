import { Component, inject, OnInit } from '@angular/core';
import { FormBuilderState } from '../../../core/services/form-builder-state';
import { CdkDrag, CdkDropList, CdkDragDrop, CdkDropListGroup } from '@angular/cdk/drag-drop';
import { FormSection } from '../../../core/models/form-section';
import { Router } from '@angular/router';

@Component({
  imports: [CdkDrag, CdkDropList, CdkDropListGroup],
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

  selectField(sectionId: number, fieldId: number) {
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
    return this.form()?.sections.map((section) => this.getFieldDropListId(section.id)) ?? [];
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
    this.formBuilderState.moveSection(event.previousIndex, event.currentIndex);
  }

  dropField(event: CdkDragDrop<number>): void {
    this.formBuilderState.moveField(
      event.previousContainer.data,
      event.container.data,
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

  openPreview(){
    const currentForm = this.form();

    if (!currentForm) return;
  
    this.router.navigate(['/forms', currentForm.id, 'preview']);
  }
}
