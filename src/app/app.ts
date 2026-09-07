import { Component, signal } from '@angular/core';
import { DynamicForm } from './features/form-fill/dynamic-form/dynamic-form';
//import { RouterOutlet } from '@angular/router';

@Component({
  selector: 'app-root',
  imports: [DynamicForm],
  templateUrl: './app.html',
  styleUrl: './app.scss'
})
export class App {
  protected readonly title = signal('FormStudio');
}
