import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { AuthService } from '../../services/auth.service';
import { AlertService } from '../../services/alert.service';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './login.component.html',
  styleUrls: ['./login.component.scss'],
})
export class LoginComponent {
  email = '';
  password = '';
  error = '';

  constructor(
    private auth: AuthService,
    private router: Router,
    private alert: AlertService,
  ) {}

  onSubmit() {
    this.error = '';
    const r = this.auth.login(this.email, this.password);
    if (r.success) {
      const base = r.role === 'admin' ? '/admin' : r.role === 'staff' ? '/staff' : '/resident';
      this.alert
        .success('Login successful', 'Welcome to BRIMS.')
        .then(() => this.router.navigate([base]));
    } else {
      this.error = 'Invalid email or password. Use the email and password set by the barangay.';
      this.alert.error('Login failed', this.error);
    }
  }

  onForgotPassword() {
    this.router.navigate(['/forgot-password']);
  }
}
