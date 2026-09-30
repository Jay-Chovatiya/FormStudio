import { Component, inject, signal } from '@angular/core';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router, ActivatedRoute } from '@angular/router';
import { AuthService } from '../../../core/services/auth.service';
import { LoginDto } from '../../../core/models/user';
import { ToastService } from '../../../core/services/toast.service';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [ReactiveFormsModule],
  templateUrl: './login.component.html',
  styleUrl: './login.component.scss'
})
export class LoginComponent {
  private readonly fb = inject(FormBuilder);
  private readonly authService = inject(AuthService);
  private readonly router = inject(Router);
  private readonly route = inject(ActivatedRoute);
  private readonly toastService = inject(ToastService);

  readonly loginForm: FormGroup = this.fb.group({
    usernameOrEmail: ['', [Validators.required]],
    password: ['', [Validators.required]],
    rememberMe: [false]
  });

  readonly loading = signal<boolean>(false);
  readonly showPassword = signal<boolean>(false);

  togglePasswordVisibility(): void {
    this.showPassword.update((v) => !v);
  }

  onSubmit(): void {
    if (this.loginForm.invalid) {
      this.loginForm.markAllAsTouched();
      this.toastService.warning('Please enter both username/email and password.', 'Required Fields');
      return;
    }

    this.loading.set(true);

    const formVal = this.loginForm.value;
    const loginDto: LoginDto = {
      usernameOrEmail: formVal.usernameOrEmail,
      password: formVal.password,
      rememberMe: !!formVal.rememberMe
    };

    this.authService.login(loginDto).subscribe({
      next: () => {
        this.loading.set(false);
        this.toastService.success('Logged in successfully!', 'Welcome');
        const returnUrl = this.route.snapshot.queryParams['returnUrl'] || '/forms';
        this.router.navigateByUrl(returnUrl);
      },
      error: () => {
        this.loading.set(false);
      }
    });
  }
}
