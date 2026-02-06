import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { AuthService } from '../../services/auth.service';

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
  ) {}

  onSubmit() {
    this.error = '';
    const r = this.auth.login(this.email, this.password);
    if (r.success) {
      const base = r.role === 'staff' ? '/staff' : '/resident';
      this.router.navigate([base]);
    } else {
      this.error = 'Invalid email or password. Use the email and password set by the barangay.';
    }
  }

  onForgotPassword() {
    this.router.navigate(['/forgot-password']);
  }
}
