import { Component, inject, OnInit } from '@angular/core';
import { FormBuilderState } from '../../../core/services/form-builder-state';
import { FormService } from '../../../core/services/form.service';
import { NavigationHistoryService } from '../../../core/services/navigation-history.service';
import { DynamicFormComponent } from '../../form-fill/dynamic-form/dynamic-form.component';
import { ActivatedRoute } from '@angular/router';

@Component({
  imports: [DynamicFormComponent],
  selector: 'app-form-preview',
  styleUrl: './form-preview.component.scss',
  templateUrl: './form-preview.component.html',
})
export class FormPreviewComponent implements OnInit {
  private readonly formBuilderState = inject(FormBuilderState);
  private readonly formService = inject(FormService);
  private readonly navHistory = inject(NavigationHistoryService);
  private readonly route = inject(ActivatedRoute);

  readonly form = this.formBuilderState.form;

  ngOnInit(): void {
    if (!this.form()) {
      const idParam = this.route.snapshot.paramMap.get('id');
      if (idParam) {
        const formId = Number(idParam);
        if (!isNaN(formId) && formId > 0) {
          this.formService.getFormById(formId).subscribe({
            next: (formDef) => {
              if (formDef) {
                this.formBuilderState.setForm(formDef);
              }
            }
          });
        }
      }
    }
  }

  goBack(): void {
    this.navHistory.back();
  }
}
