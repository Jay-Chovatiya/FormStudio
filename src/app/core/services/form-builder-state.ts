import { computed, Service, signal } from '@angular/core';
import { FormDefinition } from '../models/form-definition';
import { FormSection } from '../models/form-section';
import { FormField } from '../models/form-field';
import { FieldTypes } from '../models/field-types';

@Service()
export class FormBuilderState {
  form = signal<FormDefinition | null>(null);
  selectedSectionId = signal<number | null>(null);
  selectedFieldId = signal<number | null>(null);

  selectedField = computed<FormField | null>(() => {
    const currentForm = this.form();
    const sectionId = this.selectedSectionId();
    const fieldId = this.selectedFieldId();

    if (!currentForm || sectionId === null || fieldId === null) {
      return null;
    }

    const section = currentForm.sections.find((section) => section.id === sectionId);

    return section?.fields.find((field) => field.id === fieldId) ?? null;
  });

  selectSection(sectionId: number): void {
    this.selectedSectionId.set(sectionId);
    this.selectedFieldId.set(null);
  }

  selectField(sectionId: number, fieldId: number): void {
    this.selectedSectionId.set(sectionId);
    this.selectedFieldId.set(fieldId);
  }

  setForm(form: FormDefinition): void {
    this.form.set(form);
  }

  createForm(): void {
    const newForm: FormDefinition = {
      id: 0,
      name: 'New Form',
      description: 'write form descpription',
      code: '',
      status: 'Draft',
      sections: [],
    };

    this.form.set(newForm);
    this.createSection();
  }

  createSection(): void {
    const currentForm = this.form();
    if (!currentForm) {
      return;
    }

    const maxId = Math.max(...currentForm.sections.map((sections) => sections.id), 0);

    const newSection: FormSection = {
      id: maxId + 1,
      title: 'New Section',
      description: 'write section descpription',
      theme: '',
      visibility: true,
      fields: [],
    };

    const sections = [...currentForm.sections, newSection];

    this.form.set({
      ...currentForm,
      sections,
    });
  }

  updateSection(sectionId: number, updates: Partial<FormSection>): void {
    const currentForm = this.form();
    if (!currentForm) {
      return;
    }

    const sections = currentForm.sections.map((section) => {
      if (section.id === sectionId) {
        return {
          ...section,
          ...updates,
        };
      }

      return section;
    });

    this.form.set({
      ...currentForm,
      sections,
    });
  }

  removeSection(sectionId: number): void {
    const currentForm = this.form();
    if (!currentForm) {
      return;
    }

    const sections = currentForm.sections.filter((section) => section.id !== sectionId);

    this.form.set({
      ...currentForm,
      sections,
    });
  }

  moveSection(previousIndex: number, currentIndex: number): void {
    const currentForm = this.form();
    if (!currentForm) {
      return;
    }
    const sections = [...currentForm.sections];
    const [movedSection] = sections.splice(previousIndex, 1);
    sections.splice(currentIndex, 0, movedSection);

    this.form.set({
      ...currentForm,
      sections,
    });
  }

  addFieldToSelectedSection(type: FieldTypes): boolean {
    const currentForm = this.form();
    if (!currentForm) {
      return false;
    }

    const sectionId = this.selectedSectionId();
    if (sectionId === null) {
      return false;
    }

    const maxId = Math.max(
      ...currentForm.sections.flatMap((sections) => sections.fields.map((field) => field.id)),
      0,
    );
    const newField = {
      id: maxId + 1,
      name: 'fieldName' + (maxId + 1),
      type,
      label: 'Field Name',
      visibility: true,
    };
    return this.addField(newField);
  }

  private addField(field: FormField): boolean {
    const currentForm = this.form();
    const sectionId = this.selectedSectionId();
    if (!currentForm || sectionId == null) {
      return false;
    }

    let sectionFound = false;

    const sections = currentForm.sections.map((section) => {
      if (section.id === sectionId) {
        sectionFound = true;

        return {
          ...section,
          fields: [...section.fields, field],
        };
      }

      return section;
    });

    if (!sectionFound) {
      return false;
    }

    this.form.set({
      ...currentForm,
      sections,
    });

    return true;
  }

  updateSelectedField(updates: Partial<FormField>): void {
    const currentForm = this.form();
    const sectionId = this.selectedSectionId();
    const fieldId = this.selectedFieldId();

    if (!currentForm || sectionId == null) {
      return;
    }

    const sections = currentForm.sections.map((section) => {
      if (section.id === sectionId) {
        return {
          ...section,
          fields: section.fields.map((field) => {
            if (field.id === fieldId) {
              return {
                ...field,
                ...updates,
              };
            }
            return field;
          }),
        };
      }
      return section;
    });

    this.form.set({
      ...currentForm,
      sections,
    });
    console.log(this.selectedField());
  }

  removeField(fieldId: number): void {
    const currentForm = this.form();
    const sectionId = this.selectedSectionId();

    if (!currentForm || sectionId == null) {
      return;
    }

    const sections = currentForm.sections.map((section) => {
      if (section.id === sectionId) {
        return {
          ...section,
          fields: section.fields.filter((field) => field.id !== fieldId),
        };
      }
      return section;
    });

    this.form.set({
      ...currentForm,
      sections,
    });
  }

  moveField(previousIndex: number, currentIndex: number): void {
    const currentForm = this.form();
    const sectionId = this.selectedSectionId();
    if (!currentForm || sectionId == null) {
      return;
    }

    const sections = currentForm.sections.map((section) => {
      if (section.id === sectionId) {
        const fields = [...section.fields];
        const [movedField] = fields.splice(previousIndex, 1);
        fields.splice(currentIndex, 0, movedField);
        return {
          ...section,
          fields,
        };
      }
      return section;
    });

    this.form.set({
      ...currentForm,
      sections,
    });
  }
}
