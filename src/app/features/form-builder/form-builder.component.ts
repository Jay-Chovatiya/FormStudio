import { Component } from '@angular/core';
import { FieldPaletteComponent } from './field-palette/field-palette.component';
import { FormCanvasComponent } from './form-canvas/form-canvas.component';
import { PropertiesPanelComponent } from './properties-panel/properties-panel.component';

@Component({
  imports: [FieldPaletteComponent, FormCanvasComponent, PropertiesPanelComponent],
  selector: 'app-form-builder',
  styleUrl: './form-builder.component.scss',
  templateUrl: './form-builder.component.html',
})
export class FormBuilderComponent {
  
}
