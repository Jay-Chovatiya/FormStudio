import { Injectable, signal } from '@angular/core';

export type ToastType = 'error' | 'success' | 'warning' | 'info';

export interface Toast {
  id: string;
  type: ToastType;
  message: string;
  title?: string;
  duration?: number;
}

@Injectable({
  providedIn: 'root'
})
export class ToastService {
  private readonly _toasts = signal<Toast[]>([]);
  readonly toasts = this._toasts.asReadonly();

  private recentToasts = new Map<string, number>();
  private lastErrorTime = 0;
  private timers = new Map<string, any>();

  show(toast: Omit<Toast, 'id'>): string {
    const now = Date.now();
    const normalizedMsg = (toast.message || '').trim().toLowerCase();
    const key = `${toast.type}:${normalizedMsg}`;
    const lastTime = this.recentToasts.get(key) || 0;


    if (now - lastTime < 2000) {
      return '';
    }

    if (toast.type === 'error' && now - this.lastErrorTime < 800) {
      return '';
    }

    if (toast.type === 'error') {
      this.lastErrorTime = now;
    }
    this.recentToasts.set(key, now);

    const id = 'toast_' + Math.random().toString(36).substring(2, 9);
    const duration = toast.duration ?? (toast.type === 'error' ? 4000 : 3000);

    const newToast: Toast = {
      ...toast,
      id,
      duration
    };

    this._toasts.update((current) => [...current, newToast]);

    if (duration > 0) {
      const timer = setTimeout(() => {
        this.dismiss(id);
      }, duration);
      this.timers.set(id, timer);
    }

    return id;
  }

  error(message: string, title: string = 'Error', duration?: number): string {
    return this.show({ type: 'error', message, title, duration });
  }

  success(message: string, title: string = 'Success', duration?: number): string {
    return this.show({ type: 'success', message, title, duration });
  }

  warning(message: string, title: string = 'Warning', duration?: number): string {
    return this.show({ type: 'warning', message, title, duration });
  }

  info(message: string, title: string = 'Information', duration?: number): string {
    return this.show({ type: 'info', message, title, duration });
  }

  dismiss(id: string): void {
    const timer = this.timers.get(id);
    if (timer) {
      clearTimeout(timer);
      this.timers.delete(id);
    }
    this._toasts.update((current) => current.filter((t) => t.id !== id));
  }

  clear(): void {
    this.timers.forEach((timer) => clearTimeout(timer));
    this.timers.clear();
    this._toasts.set([]);
  }
}
