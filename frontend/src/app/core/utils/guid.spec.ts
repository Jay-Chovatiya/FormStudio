import { generateGuid, normalizeFormGuids, stripGuidsFromForm } from './guid';
import { FormDefinition } from '../models/form-definition';
import { FormBuilderState } from '../services/form-builder-state';
import { TestBed } from '@angular/core/testing';

describe('GUID Utilities and Form Element Tracking', () => {
  it('should generate a valid UUID v4 format', () => {
    const guid = generateGuid();
    expect(guid).toMatch(
      /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i
    );
  });

  it('should fallback to existing id when editing form where guid is not present', () => {
    const existingForm: FormDefinition = {
      id: 101,
      name: 'Test Form',
      description: 'Test Description',
      code: 'test_form',
      category: 'General',
      status: 'Published',
      allowMultipleSubmissions: true,
      allowSaveAsDraft: true,
      sections: [
        {
          id: 5,
          title: 'Existing Section',
          visibility: true,
          fields: [
            {
              id: 50,
              name: 'existingField',
              type: 'Dropdown',
              label: 'Existing Field',
              visibility: true,
              options: [
                { id: 501, label: 'Opt 1', value: 'opt_1' },
                { id: 502, label: 'Opt 2', value: 'opt_2' },
              ],
              validations: [
                { type: 'required' },
                { type: 'minLength', value: 3 },
              ],
            },
          ],
        },
      ],
    };

    const normalized = normalizeFormGuids(existingForm);

    // Section should have guid = id as string
    expect(normalized.sections[0].guid).toBe('5');

    // Field should have guid = id as string
    const field = normalized.sections[0].fields[0];
    expect(field.guid).toBe('50');

    // Options should have guid = id as string
    expect(field.options![0].guid).toBe('501');
    expect(field.options![1].guid).toBe('502');

    // Validations are preserved as-is without adding guid
    expect((field.validations![0] as any).guid).toBeUndefined();
    expect(field.validations![0].type).toBe('required');
  });

  it('should exclude GUIDs from the API payload when calling stripGuidsFromForm', () => {
    const formWithGuids: FormDefinition = {
      id: 1,
      name: 'Save Form',
      description: 'Desc',
      code: 'save_form',
      category: 'General',
      status: 'Draft',
      allowMultipleSubmissions: false,
      allowSaveAsDraft: false,
      sections: [
        {
          id: 1,
          guid: 'section-guid-1234',
          title: 'Section 1',
          visibility: true,
          fields: [
            {
              id: 2,
              guid: 'field-guid-5678',
              name: 'emailField',
              type: 'Email',
              label: 'Email',
              visibility: true,
              options: [
                { id: 3, guid: 'opt-guid-999', label: 'Opt', value: 'opt' },
              ],
              validations: [
                { type: 'required' },
              ],
            },
          ],
        },
      ],
    };

    const clean = stripGuidsFromForm(formWithGuids);

    expect((clean.sections[0] as any).guid).toBeUndefined();
    expect((clean.sections[0].fields[0] as any).guid).toBeUndefined();
    expect((clean.sections[0].fields[0].options![0] as any).guid).toBeUndefined();
    expect(clean.sections[0].fields[0].name).toBe('emailField');
  });

  it('should assign a new GUID when adding section, field, and options in FormBuilderState', () => {
    TestBed.configureTestingModule({
      providers: [FormBuilderState],
    });

    const state = TestBed.inject(FormBuilderState);
    state.createNewForm('New Form');

    const form = state.form();
    expect(form).toBeTruthy();
    expect(form!.sections.length).toBe(1);

    // Initial section created via addSection has GUID and id: 0
    const initialSection = form!.sections[0];
    expect(initialSection.id).toBe(0);
    expect(initialSection.guid).toBeDefined();
    expect(initialSection.guid!.length).toBeGreaterThan(10);

    // Add a second section
    const newSection = state.addSection('Section 2');
    expect(newSection.id).toBe(0);
    expect(newSection.guid).toBeDefined();
    expect(newSection.guid).not.toBe(initialSection.guid);

    // Add a Dropdown field to the new section
    state.addFieldToSection(newSection.guid!, 'Dropdown');
    const updatedForm = state.form()!;
    const sec2 = updatedForm.sections.find((s) => s.guid === newSection.guid)!;
    expect(sec2.fields.length).toBe(1);

    const field = sec2.fields[0];
    expect(field.id).toBe(0);
    expect(field.guid).toBeDefined();
    expect(field.guid!.length).toBeGreaterThan(10);

    // Options should also each have id: 0 and their own unique GUID
    expect(field.options?.length).toBe(3);
    expect(field.options![0].id).toBe(0);
    const guids = new Set(field.options?.map((o) => o.guid));
    expect(guids.size).toBe(3);
  });
});
