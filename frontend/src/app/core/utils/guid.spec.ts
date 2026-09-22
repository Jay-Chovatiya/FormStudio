import { generateGuid, normalizeFormGuids, stripGuidsFromForm, cleanValueQuotes } from './guid';
import { FormDefinition } from '../models/form-definition';
import { FormBuilderState } from '../services/form-builder-state';
import { TestBed } from '@angular/core/testing';
import { PropertiesPanelComponent } from '../../features/form-builder/properties-panel/properties-panel.component';

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

  it('should preserve valid startDate/endDate and normalize empty date strings to null in stripGuidsFromForm', () => {
    const formWithDates: FormDefinition = {
      id: 1,
      name: 'Date Form',
      code: 'date_form',
      description: 'Desc',
      status: 'Draft',
      startDate: '2026-09-25T14:30',
      endDate: '   ',
      sections: [],
    };

    const clean = stripGuidsFromForm(formWithDates);
    expect(clean.startDate).toBe('2026-09-25T14:30');
    expect(clean.endDate).toBeNull();
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

  it('should assign sequential displayOrder matching visual array order in stripGuidsFromForm', () => {
    const formWithElements: FormDefinition = {
      id: 1,
      name: 'Order Test',
      code: 'order_test',
      description: 'Test Desc',
      status: 'Draft',
      sections: [
        {
          id: 10,
          title: 'Section 1',
          visibility: true,
          fields: [
            {
              id: 101,
              name: 'f1',
              type: 'Textbox',
              label: 'Field 1',
              visibility: true,
            },
            {
              id: 102,
              name: 'f2',
              type: 'Dropdown',
              label: 'Field 2',
              visibility: true,
              options: [
                { id: 1001, label: 'Opt A', value: 'a' },
                { id: 1002, label: 'Opt B', value: 'b' },
              ],
            },
          ],
        },
        {
          id: 20,
          title: 'Section 2',
          visibility: true,
          fields: [
            {
              id: 201,
              name: 'f3',
              type: 'Number',
              label: 'Field 3',
              visibility: true,
            },
          ],
        },
      ],
    };

    const stripped = stripGuidsFromForm(formWithElements);

    // Section displayOrder
    expect(stripped.sections[0].displayOrder).toBe(0);
    expect(stripped.sections[1].displayOrder).toBe(1);

    // Field displayOrder
    expect(stripped.sections[0].fields[0].displayOrder).toBe(0);
    expect(stripped.sections[0].fields[1].displayOrder).toBe(1);
    expect(stripped.sections[1].fields[0].displayOrder).toBe(0);

    // Option displayOrder
    expect(stripped.sections[0].fields[1].options![0].displayOrder).toBe(0);
    expect(stripped.sections[0].fields[1].options![1].displayOrder).toBe(1);
  });

  it('should clean legacy escaped quotes from default value in normalizeFormGuids and stripGuidsFromForm', () => {
    const formWithLegacyQuotes: FormDefinition = {
      id: 1,
      name: 'Quote Test',
      code: 'quote_test',
      description: 'Quote Desc',
      status: 'Draft',
      sections: [
        {
          id: 1,
          title: 'Section',
          visibility: true,
          fields: [
            {
              id: 1,
              name: 'radioField',
              type: 'RadioButton',
              label: 'Radio Field',
              visibility: true,
              default: '"very_smooth"',
            },
            {
              id: 2,
              name: 'dateField',
              type: 'Date',
              label: 'Date Field',
              visibility: true,
              default: '""',
            },
          ],
        },
      ],
    };

    const normalized = normalizeFormGuids(formWithLegacyQuotes);
    expect(normalized.sections[0].fields[0].default).toBe('very_smooth');
    expect(normalized.sections[0].fields[1].default).toBeNull();

    const stripped = stripGuidsFromForm(normalized);
    expect(stripped.sections[0].fields[0].default).toBe('very_smooth');
    expect(stripped.sections[0].fields[1].default).toBeNull();
  });

  it('should thoroughly clean nested unicode escapes, escaped quotes, and empty values via cleanValueQuotes', () => {
    // Nested quote and unicode patterns like "\u0022\\u0022M\\u0022\u0022"
    expect(cleanValueQuotes('\\u0022M\\u0022')).toBe('M');
    expect(cleanValueQuotes('\\\\u0022M\\\\u0022')).toBe('M');
    expect(cleanValueQuotes('\"\\u0022\\\\u0022M\\\\u0022\\u0022\"')).toBe('M');
    expect(cleanValueQuotes('""2026-09-22T12:01""')).toBe('2026-09-22T12:01');
    expect(cleanValueQuotes('\\u00222026-09-22T12:01\\u0022')).toBe('2026-09-22T12:01');
    expect(cleanValueQuotes('\\"M\\"')).toBe('M');
    expect(cleanValueQuotes('"M"')).toBe('M');
    expect(cleanValueQuotes("'M'")).toBe('M');

    // Empty and quote-only inputs should normalize to null
    expect(cleanValueQuotes('')).toBeNull();
    expect(cleanValueQuotes('   ')).toBeNull();
    expect(cleanValueQuotes('""')).toBeNull();
    expect(cleanValueQuotes("''")).toBeNull();
    expect(cleanValueQuotes('\\u0022\\u0022')).toBeNull();
    expect(cleanValueQuotes('\\\\u0022\\\\u0022')).toBeNull();
    expect(cleanValueQuotes('\\"\\"')).toBeNull();
    expect(cleanValueQuotes(null)).toBeNull();
    expect(cleanValueQuotes(undefined)).toBeNull();

    // Primitive values preserved
    expect(cleanValueQuotes(42)).toBe(42);
    expect(cleanValueQuotes(true)).toBe(true);
    expect(cleanValueQuotes(false)).toBe(false);
  });

  it('should move fields within and between sections in FormBuilderState without duplicating', () => {
    TestBed.configureTestingModule({
      providers: [FormBuilderState],
    });

    const state = TestBed.inject(FormBuilderState);
    state.createNewForm('Move Test');

    const form = state.form()!;
    const sec1Guid = form.sections[0].guid!;
    state.addFieldToSection(sec1Guid, 'Textbox');
    state.addFieldToSection(sec1Guid, 'Number');

    let current = state.form()!;
    expect(current.sections[0].fields.length).toBe(2);
    expect(current.sections[0].fields[0].type).toBe('Textbox');
    expect(current.sections[0].fields[1].type).toBe('Number');

    // Move field from index 1 to index 0 within sec1
    state.moveField(sec1Guid, sec1Guid, 1, 0);

    current = state.form()!;
    expect(current.sections[0].fields.length).toBe(2);
    expect(current.sections[0].fields[0].type).toBe('Number');
    expect(current.sections[0].fields[1].type).toBe('Textbox');

    // Add second section and move field across sections
    const sec2 = state.addSection('Section 2');
    state.moveField(sec1Guid, sec2.guid!, 0, 0);

    current = state.form()!;
    const s1 = current.sections.find((s) => s.guid === sec1Guid)!;
    const s2 = current.sections.find((s) => s.guid === sec2.guid)!;

    expect(s1.fields.length).toBe(1);
    expect(s1.fields[0].type).toBe('Textbox');
    expect(s2.fields.length).toBe(1);
    expect(s2.fields[0].type).toBe('Number');
  });

  it('should update default value when the selected option value is changed in PropertiesPanelComponent', async () => {
    TestBed.configureTestingModule({
      providers: [FormBuilderState, PropertiesPanelComponent],
    });

    const panel = TestBed.inject(PropertiesPanelComponent);
    const optionForm = panel.createOptionForm({ id: 1, guid: 'opt-1', label: 'Male', value: 'M' });
    panel.fieldForm.controls.default.setValue('M');

    // Change option value from 'M' to 'Male_Value'
    optionForm.controls['value'].setValue('Male_Value');
    await new Promise((resolve) => setTimeout(resolve, 20));

    // Default value should be updated to 'Male_Value'
    expect(panel.fieldForm.controls.default.value).toBe('Male_Value');
  });
});
