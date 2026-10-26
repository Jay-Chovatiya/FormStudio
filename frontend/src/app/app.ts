import { Component, signal } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { ToastComponent } from './shared/components/toast/toast.component';
import { HeroBackgroundComponent } from './shared/components/hero-background/hero-background.component';

@Component({
  selector: 'app-root',
  imports: [RouterOutlet, ToastComponent, HeroBackgroundComponent],
  templateUrl: './app.html',
  styleUrl: './app.scss'
})
export class App {
  protected readonly title = signal('FormStudio');
}
