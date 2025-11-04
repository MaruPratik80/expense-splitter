import { Component, inject } from '@angular/core';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router, RouterModule } from '@angular/router';
import { MatCardModule } from '@angular/material/card';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatDividerModule } from '@angular/material/divider';
import { AuthService } from '../../services/auth.service';
import { CommonModule } from '@angular/common';
import { NotificationService } from '../../services/notification.service';

@Component({
  selector: 'app-login',
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
  templateUrl: './login.html',
  styleUrl: './login.scss',
})
export class Login {
  private fb = inject(FormBuilder);
  private authService = inject(AuthService);
  private router = inject(Router);
  private notificationService = inject(NotificationService);

  hidePassword = true;
  loading = false;

  loginForm: FormGroup = this.fb.group({
    email: ['', [Validators.required, Validators.email]],
    password: ['', [Validators.required, Validators.minLength(6)]],
  });

  onSubmit(): void {
    if (this.loginForm.valid) {
      this.loading = true;
      const { email, password } = this.loginForm.value;

      this.authService.signIn(email, password).subscribe({
        next: () => {
          this.notificationService.showSuccess('Logged in successfully!');
          this.router.navigate(['/groups']);
        },
        error: (error) => {
          this.loading = false;
          this.notificationService.showError(
            error.code === 'auth/invalid-credential'
              ? 'Invalid email or password'
              : 'Login failed. Please try again.'
          );
        },
      });
    }
  }

  signInWithGoogle(): void {
    this.loading = true;
    this.authService.signInWithGoogle().subscribe({
      next: () => {
        this.notificationService.showSuccess('Logged in successfully!');
        this.router.navigate(['/groups']);
      },
      error: (error) => {
        this.loading = false;
        this.notificationService.showError('Google sign-in failed. Please try again.');
      },
    });
  }
}
