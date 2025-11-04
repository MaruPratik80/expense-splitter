import { CommonModule } from '@angular/common';
import { Component, inject } from '@angular/core';
import { ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatDividerModule } from '@angular/material/divider';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { RouterModule, Router } from '@angular/router';
import { AuthService } from '../../services/auth.service';
import { NotificationService } from '../../services/notification.service';

@Component({
  selector: 'app-signup',
  imports: [
    CommonModule,
    ReactiveFormsModule,
    RouterModule,
    MatCardModule,
    MatFormFieldModule,
    MatInputModule,
    MatButtonModule,
    MatIconModule,
    MatDividerModule,
  ],
  templateUrl: './signup.html',
  styleUrl: './signup.scss',
})
export class Signup {
  private fb = inject(FormBuilder);
  private authService = inject(AuthService);
  private router = inject(Router);
  private notificationService = inject(NotificationService);

  hidePassword = true;
  hideConfirmPassword = true;
  loading = false;

  signupForm: FormGroup = this.fb.group(
    {
      displayName: ['', [Validators.required]],
      email: ['', [Validators.required, Validators.email]],
      password: ['', [Validators.required, Validators.minLength(6)]],
      confirmPassword: ['', [Validators.required]],
    },
    { validators: this.passwordMatchValidator }
  );

  passwordMatchValidator(form: FormGroup) {
    const password = form.get('password');
    const confirmPassword = form.get('confirmPassword');

    if (password && confirmPassword && password.value !== confirmPassword.value) {
      return { passwordMismatch: true };
    }
    return null;
  }

  onSubmit(): void {
    if (this.signupForm.valid) {
      this.loading = true;
      const { email, password, displayName } = this.signupForm.value;

      this.authService.signUp(email, password, displayName).subscribe({
        next: () => {
          this.notificationService.showSuccess('Account created successfully!');
          this.router.navigate(['/groups']);
        },
        error: (error) => {
          this.loading = false;
          this.notificationService.showError(
            error.code === 'auth/email-already-in-use'
              ? 'Email already in use'
              : 'Sign up failed. Please try again.'
          );
        },
      });
    }
  }

  signInWithGoogle(): void {
    this.loading = true;
    this.authService.signInWithGoogle().subscribe({
      next: () => {
        this.notificationService.showSuccess('Account created successfully!');
        this.router.navigate(['/groups']);
      },
      error: (error) => {
        this.loading = false;
        this.notificationService.showError('Google sign-in failed. Please try again.');
      },
    });
  }
}
