import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { AuthService } from '../../services/auth.service';
import { AlertService } from '../../services/alert.service';

const REMEMBER_EMAIL_KEY = 'brims_login_remember_email';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink],
  templateUrl: './login.component.html',
  styleUrls: ['./login.component.scss'],
})
export class LoginComponent implements OnInit {
  email = '';
  password = '';
  error = '';
  showPassword = false;
  loading = false;
  rememberMe = false;

  constructor(
    private auth: AuthService,
    private router: Router,
    private alert: AlertService,
  ) {}

  ngOnInit() {
    try {
      const saved = localStorage.getItem(REMEMBER_EMAIL_KEY);
      if (saved) {
        this.email = saved;
        this.rememberMe = true;
      }
    } catch {
      // ignore
    }
  }

  private validate(): string | null {
    const e = (this.email || '').trim();
    const p = this.password;
    if (!e) return 'Please enter your email or username.';
    if (e.includes('@')) {
      const emailRe = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRe.test(e)) return 'Please enter a valid email address.';
    }
    if (!p) return 'Please enter your password.';
    return null;
  }

  onSubmit() {
    this.error = '';
    const validationError = this.validate();
    if (validationError) {
      this.error = validationError;
      this.alert.error('Invalid input', validationError);
      return;
    }
    this.loading = true;
    const r = this.auth.login(this.email.trim(), this.password);
    if (r.success) {
      try {
        if (this.rememberMe) {
          localStorage.setItem(REMEMBER_EMAIL_KEY, this.email.trim());
        } else {
          localStorage.removeItem(REMEMBER_EMAIL_KEY);
        }
      } catch {
        // ignore
      }
      // Navigate directly to the dashboard for the logged-in role
      const base =
        r.role === 'admin'
          ? '/admin/dashboard'
          : r.role === 'staff'
          ? '/staff/dashboard'
          : '/resident/dashboard';
      this.alert
        .successToast('Login successful', 'Welcome to BRIMS.', 1000)
        .then(() => {
          this.loading = false;
          this.router.navigate([base]);
        })
        .catch(() => {
          this.loading = false;
        });
    } else {
      this.loading = false;
      this.error = 'Invalid email or password. Use the email and password set by the barangay.';
      this.alert.error('Login failed', this.error);
    }
  }

  toggleShowPassword() {
    this.showPassword = !this.showPassword;
  }

  onForgotPassword() {
    this.router.navigate(['/forgot-password']);
  }
}
