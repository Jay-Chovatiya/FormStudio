import { computed, Service, signal } from '@angular/core';
import { FormDefinition } from '../models/form-definition';
import { FormSection } from '../models/form-section';
import { FormField } from '../models/form-field';
import { FieldTypes } from '../models/field-types';

@Service()
export class FormBuilderState {
  readonly form = signal<FormDefinition | null>(null);
  readonly selectedSectionId = signal<number | null>(null);
  readonly selectedFieldId = signal<number | null>(null);
  readonly activeTab = signal<'field' | 'section' | 'form'>('form');

  private historyStack: FormDefinition[] = [];
  private futureStack: FormDefinition[] = [];
  readonly canUndo = signal<boolean>(false);
  readonly canRedo = signal<boolean>(false);

  // Computed signals
  readonly selectedSection = computed<FormSection | null>(() => {
    const currentForm = this.form();
    const sectionId = this.selectedSectionId();
    if (!currentForm || sectionId === null) return null;
    return currentForm.sections.find((s) => s.id === sectionId) ?? null;
  });

  readonly selectedField = computed<FormField | null>(() => {
    const section = this.selectedSection();
    const fieldId = this.selectedFieldId();
    if (!section || fieldId === null) return null;
    return section.fields.find((f) => f.id === fieldId) ?? null;
  });

  selectSection(sectionId: number): void {
    this.selectedSectionId.set(sectionId);
    this.selectedFieldId.set(null);
    this.activeTab.set('section');
  }

  selectField(sectionId: number, fieldId: number): void {
    this.selectedSectionId.set(sectionId);
    this.selectedFieldId.set(fieldId);
    this.activeTab.set('field');
  }

  selectFormSettings(): void {
    this.selectedSectionId.set(null);
    this.selectedFieldId.set(null);
    this.activeTab.set('form');
  }

  setActiveTab(tab: 'field' | 'section' | 'form'): void {
    this.activeTab.set(tab);
  }

  setForm(formDefinition: FormDefinition): void {
    this.recordState();
    this.form.set(structuredClone(formDefinition));
    if (formDefinition.sections.length > 0) {
      this.selectedSectionId.set(formDefinition.sections[0].id);
    } else {
      this.selectedSectionId.set(null);
    }
    this.selectedFieldId.set(null);
    this.activeTab.set('form');
  }

  createNewForm(name: string = 'Untitled Form', description: string = ''): void {
    const newForm: FormDefinition = {
      id: Date.now(),
      name,
      description: description || 'Visual form created with Form Studio',
      code: 'form_' + Math.random().toString(36).substring(2, 8),
      category: 'Registration',
      status: 'Draft',
      allowMultipleSubmissions: true,
      allowSaveAsDraft: true,
      confirmationMessage: 'Thank you! Your response has been submitted successfully.',
      submitButtonText: 'Submit',
      cancelButtonText: 'Cancel',
      sections: [],
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    this.form.set(newForm);
    this.addSection('General Information', 'Please complete all required fields below');
    this.activeTab.set('form');
  }

  updateFormMetadata(updates: Partial<FormDefinition>): void {
    const current = this.form();
    if (!current) return;
    this.recordState();
    this.form.set({
      ...current,
      ...updates,
      updatedAt: new Date().toISOString(),
    });
    console.log(this.form());
  }

  // Section operations
  addSection(title: string = 'New Section', description: string = ''): FormSection {
    const current = this.form();
    const maxId = current?.sections ? Math.max(...current.sections.map((s) => s.id), 0) : 0;
    const newSection: FormSection = {
      id: maxId + 1,
      title,
      description,
      visibility: true,
      fields: [],
    };

    if (current) {
      this.recordState();
      const sections = [...current.sections, newSection];
      this.form.set({ ...current, sections, updatedAt: new Date().toISOString() });
    }
    this.selectSection(newSection.id);
    return newSection;
  }

  updateSection(updates: Partial<FormSection>): void {
    const current = this.form();
    const sectionId = this.selectedSectionId();
    if (!current || sectionId === null) return;
    this.recordState();
    const sections = current.sections.map((s) => (s.id === sectionId ? { ...s, ...updates } : s));
    this.form.set({ ...current, sections, updatedAt: new Date().toISOString() });
  }

  removeSection(sectionId: number): void {
    const current = this.form();
    if (!current) return;
    this.recordState();
    const sections = current.sections.filter((s) => s.id !== sectionId);
    this.form.set({ ...current, sections, updatedAt: new Date().toISOString() });
    if (this.selectedSectionId() === sectionId) {
      const remainingId = sections.length > 0 ? sections[0].id : null;
      this.selectedSectionId.set(remainingId);
      this.selectedFieldId.set(null);
    }
  }

  moveSection(previousIndex: number, currentIndex: number): void {
    const current = this.form();
    if (!current || previousIndex === currentIndex) return;
    this.recordState();
    const sections = [...current.sections];
    const [moved] = sections.splice(previousIndex, 1);
    sections.splice(currentIndex, 0, moved);
    this.form.set({ ...current, sections, updatedAt: new Date().toISOString() });
  }

  addFieldToSelectedSection(type: FieldTypes): boolean {
    const currentForm = this.form();
    if (!currentForm) return false;

    let sectionId = this.selectedSectionId();
    let sections = currentForm.sections;

    if (sectionId === null || !sections.some((s) => s.id === sectionId)) {
      if (sections.length > 0) {
        sectionId = sections[0].id;
        this.selectedSectionId.set(sectionId);
      } else {
        const newSection = this.addSection('Section 1');
        sectionId = newSection.id;
      }
    }

    return this.addFieldToSection(sectionId, type);
  }

  addFieldToSection(sectionId: number, type: FieldTypes, atIndex?: number): boolean {
    const currentForm = this.form();
    if (!currentForm) return false;

    this.recordState();

    let sections = currentForm.sections;
    const targetSection = sections.find((s) => s.id === sectionId);
    if (!targetSection) return false;

    const allFields = sections.flatMap((s) => s.fields);
    const maxId = Math.max(...allFields.map((f) => f.id), 0);
    const fieldId = maxId + 1;

    const newField: FormField = {
      id: fieldId,
      name: `${type.toLowerCase()}_${fieldId}`,
      type,
      label: this.getDefaultLabel(type),
      placeholder: this.getDefaultPlaceholder(type),
      helperDescription: '',
      default: '',
      // icon: '',
      visibility: true,
      validations: type === 'Email' ? [{ type: 'email' }] : [],
      options: this.getDefaultOptions(type),
    };

    sections = sections.map((section) => {
      if (section.id === sectionId) {
        const fields = [...section.fields];
        const insertIndex = atIndex !== undefined ? atIndex : fields.length;
        fields.splice(insertIndex, 0, newField);
        return { ...section, fields };
      }
      return section;
    });

    this.form.set({
      ...currentForm,
      sections,
      updatedAt: new Date().toISOString(),
    });

    this.selectField(sectionId, fieldId);
    return true;
  }

  updateSelectedField(updates: Partial<FormField>): void {
    const current = this.form();
    const sectionId = this.selectedSectionId();
    const fieldId = this.selectedFieldId();
    if (!current || sectionId === null || fieldId === null) return;

    this.recordState();
    const sections = current.sections.map((s) => {
      if (s.id === sectionId) {
        return {
          ...s,
          fields: s.fields.map((f) => (f.id === fieldId ? { ...f, ...updates } : f)),
        };
      }
      return s;
    });

    this.form.set({ ...current, sections, updatedAt: new Date().toISOString() });
  }

  removeField(fieldId: number): void {
    const current = this.form();
    const sectionId = this.selectedSectionId();
    if (!current || sectionId === null) return;
    this.recordState();
    const sections = current.sections.map((s) => {
      if (s.id === sectionId) {
        return { ...s, fields: s.fields.filter((f) => f.id !== fieldId) };
      }
      return s;
    });

    this.form.set({ ...current, sections, updatedAt: new Date().toISOString() });
    if (this.selectedFieldId() === fieldId) {
      this.selectedFieldId.set(null);
      this.activeTab.set('section');
    }
  }

  duplicateField(sectionId: number, fieldId: number): void {
    const current = this.form();
    if (!current) return;
    const section = current.sections.find((s) => s.id === sectionId);
    const field = section?.fields.find((f) => f.id === fieldId);
    if (!field) return;

    const allFields = current.sections.flatMap((s) => s.fields);
    const maxId = Math.max(...allFields.map((f) => f.id), 0);
    const newFieldId = maxId + 1;

    const clonedField: FormField = {
      ...structuredClone(field),
      id: newFieldId,
      name: `${field.name}_copy`,
      label: `${field.label} (Copy)`,
    };

    this.recordState();
    const sections = current.sections.map((s) => {
      if (s.id === sectionId) {
        const index = s.fields.findIndex((f) => f.id === fieldId);
        const fields = [...s.fields];
        fields.splice(index + 1, 0, clonedField);
        return { ...s, fields };
      }
      return s;
    });

    this.form.set({ ...current, sections, updatedAt: new Date().toISOString() });
    this.selectField(sectionId, newFieldId);
  }

  moveField(
    fromSectionId: number,
    toSectionId: number,
    previousIndex: number,
    currentIndex: number,
  ): void {
    const current = this.form();
    if (!current) return;

    this.recordState();

    if (fromSectionId === toSectionId) {
      const sections = current.sections.map((section) => {
        if (section.id === fromSectionId) {
          const fields = [...section.fields];
          const [movedField] = fields.splice(previousIndex, 1);
          if (movedField) {
            fields.splice(currentIndex, 0, movedField);
          }
          return { ...section, fields };
        }
        return section;
      });
      this.form.set({ ...current, sections, updatedAt: new Date().toISOString() });
      return;
    }

    let movedField: FormField | null = null;
    const sectionsAfterRemoval = current.sections.map((section) => {
      if (section.id === fromSectionId) {
        const fields = [...section.fields];
        [movedField] = fields.splice(previousIndex, 1);
        return { ...section, fields };
      }
      return section;
    });

    if (!movedField) return;

    const finalSections = sectionsAfterRemoval.map((section) => {
      if (section.id === toSectionId) {
        const fields = [...section.fields];
        fields.splice(currentIndex, 0, movedField!);
        return { ...section, fields };
      }
      return section;
    });

    this.form.set({ ...current, sections: finalSections, updatedAt: new Date().toISOString() });
  }

  // Undo / Redo helpers
  private recordState(): void {
    const current = this.form();
    if (!current) return;

    this.historyStack.push(structuredClone(current));

    if (this.historyStack.length > 10) this.historyStack.shift();

    this.futureStack = [];
    this.canUndo.set(true);
    this.canRedo.set(false);
  }

  undo(): void {
    const current = this.form();
    if (!current || this.historyStack.length === 0) return;

    this.futureStack.push(structuredClone(current));
    this.canRedo.set(true);

    const previous = this.historyStack.pop()!;
    this.form.set(structuredClone(previous));
    this.canUndo.set(this.historyStack.length > 0);
  }

  redo(): void {
    const current = this.form();
    if (!current || this.futureStack.length === 0) return;

    this.historyStack.push(structuredClone(current));
    this.canUndo.set(true);

    const next = this.futureStack.pop()!;
    this.form.set(structuredClone(next));
    this.canRedo.set(this.futureStack.length > 0);
  }

  // Helper defaults
  private getDefaultLabel(type: FieldTypes): string {
    switch (type) {
      case 'Textbox': return 'Text Field';
      case 'Textarea': return 'Multiline Description';
      case 'Number': return 'Quantity / Amount';
      case 'Email': return 'Email Address';
      case 'Date': return 'Select Date';
      case 'Dropdown': return 'Choose Option';
      case 'RadioButton': return 'Select One';
      case 'Checkbox': return 'Select Items';
      default: return 'Field Label';
    }
  }

  private getDefaultPlaceholder(type: FieldTypes): string {
    switch (type) {
      case 'Textbox': return 'Enter text...';
      case 'Textarea': return 'Type detailed comments...';
      case 'Number': return '0';
      case 'Email': return 'user@example.com';
      case 'Date': return 'YYYY-MM-DD';
      case 'Dropdown': return 'Select from list...';
      default: return '';
    }
  }

  private getDefaultOptions(type: FieldTypes) {
    if (type === 'Dropdown' || type === 'RadioButton' || type === 'Checkbox') {
      return [
        { id: 1, label: 'Option 1', value: 'option_1' },
        { id: 2, label: 'Option 2', value: 'option_2' },
        { id: 3, label: 'Option 3', value: 'option_3' },
      ];
    }
    return undefined;
  }
}
