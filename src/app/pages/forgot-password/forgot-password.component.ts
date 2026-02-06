import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { AuthService } from '../../services/auth.service';

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
    this.loading = true;

    // Simulate API call
    setTimeout(() => {
      const result = this.auth.forgotPassword(this.email);
      this.loading = false;
      
      if (result.success) {
        this.success = true;
      } else {
        this.error = result.message || 'Failed to send reset email. Please try again.';
      }
    }, 1000);
  }

  backToLogin() {
    this.router.navigate(['/login']);
  }

  private isValidEmail(email: string): boolean {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  }
}
