import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { timeout, finalize } from 'rxjs';
import { AuthService } from '../../services/auth.service';
import { ApiConfigService } from '../../services/api-config.service';
import { EmailService } from '../../services/email.service';

@Component({
  selector: 'app-forgot-password',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './forgot-password.component.html',
  styleUrls: ['./forgot-password.component.scss'],
})
export class ForgotPasswordComponent {
  email = '';
  error = '';
  success = false;
  loading = false;

  constructor(
    private auth: AuthService,
    private router: Router,
    private apiConfig: ApiConfigService,
    private emailService: EmailService,
  ) {}

  onSubmit() {
    if (!this.email) {
      this.error = 'Please enter your email address.';
      return;
    }

    if (!this.isValidEmail(this.email)) {
      this.error = 'Please enter a valid email address.';
      return;
    }

    this.error = '';
    if (this.apiConfig.isPlaceholderUrl) {
      this.error =
        'Backend not configured. Set apiBaseUrl in assets/config.json and redeploy.';
      return;
    }

    this.loading = true;

    const result = this.auth.forgotPassword(this.email.trim());

    if (!result.success) {
      this.loading = false;
      this.error = result.message || 'Failed to send reset email. Please try again.';
      return;
    }

    if (result.resetLink) {
      const subject = 'Reset your BRIMMS password';
      const message = `Click the link below to reset your password. This link expires in 1 hour.\n\n${result.resetLink}\n\nIf you did not request this, please ignore this email.`;
      this.emailService
        .sendEmail({ to: this.email.trim(), subject, message })
        .pipe(
          timeout(90000),
          finalize(() => (this.loading = false)),
        )
        .subscribe({
          next: (res) => {
            this.success = res.success;
            if (!res.success) {
              this.error = res.error || 'Failed to send reset email. Please try again.';
            }
          },
          error: (err) => {
            const isTimeout = err?.name === 'TimeoutError' || err?.message?.includes('Timeout');
            if (isTimeout) {
              this.error =
                'Request timed out. The backend may be starting (cold start). Wait a moment and try again.';
              return;
            }
            const msg =
              err?.error?.error ||
              err?.message ||
              'Failed to send reset email. Please check your connection and try again.';
            this.error =
              typeof msg === 'string' && (msg.includes('Unexpected token') || msg.includes('parsing'))
                ? 'Cannot reach the email server. Check that the backend is running and CORS is configured.'
                : msg;
          },
        });
    } else {
      this.loading = false;
      this.success = true;
    }
  }

  backToLogin() {
    this.router.navigate(['/login']);
  }

  private isValidEmail(email: string): boolean {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  }
}
