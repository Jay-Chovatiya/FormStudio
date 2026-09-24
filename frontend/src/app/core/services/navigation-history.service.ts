import { Injectable, inject } from '@angular/core';
import { Router, NavigationEnd } from '@angular/router';
import { filter } from 'rxjs';

@Injectable({
  providedIn: 'root',
})
export class NavigationHistoryService {
  private readonly router = inject(Router);
  private readonly history: string[] = [];

  constructor() {
    if (this.router.url) {
      this.history.push(this.router.url);
    }

    this.router.events
      .pipe(filter((event): event is NavigationEnd => event instanceof NavigationEnd))
      .subscribe((event: NavigationEnd) => {
        const url = event.urlAfterRedirects;
        
        if (this.history[this.history.length - 1] !== url) {
          this.history.push(url);
        }
      });
  }

  getPreviousUrl(): string | null {
    return this.history.length > 1 ? this.history[this.history.length - 2] : null;
  }

  back(fallbackUrl: string = '/forms'): void {
    this.history.pop();
    const previousUrl = this.history.pop();

    if (previousUrl) {
      if (previousUrl.includes('/form-builder')) {
        this.router.navigateByUrl(previousUrl, { state: { fromPreview: true } });
      } else {
        this.router.navigateByUrl(previousUrl);
      }
    } else {
      this.router.navigateByUrl(fallbackUrl);
    }
  }
}
