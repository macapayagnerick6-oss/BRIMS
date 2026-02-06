import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router, ActivatedRoute } from '@angular/router';
import { AuthService } from '../../services/auth.service';

@Component({
  selector: 'app-reset-password',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './reset-password.component.html',
  styleUrls: ['./reset-password.component.scss'],
})
export class ResetPasswordComponent implements OnInit {
  token = '';
  email = '';
  password = '';
  confirmPassword = '';
  error = '';
  success = false;
  loading = false;

  constructor(
    private auth: AuthService,
    private router: Router,
    private route: ActivatedRoute,
  ) {}

  ngOnInit() {
    this.route.queryParams.subscribe(params => {
      this.token = params['token'] || '';
      this.email = params['email'] || '';
      
      if (!this.token || !this.email) {
        this.error = 'Invalid reset link. Please request a new password reset.';
      }
    });
  }

  onSubmit() {
    if (!this.password || !this.confirmPassword) {
      this.error = 'Please fill in all fields.';
      return;
    }

    if (this.password !== this.confirmPassword) {
      this.error = 'Passwords do not match.';
      return;
    }

    if (this.password.length < 8) {
      this.error = 'Password must be at least 8 characters long.';
      return;
    }

    this.error = '';
    this.loading = true;

    // Simulate API call
    setTimeout(() => {
      const result = this.auth.resetPassword(this.token, this.email, this.password);
      this.loading = false;
      
      if (result.success) {
        this.success = true;
        setTimeout(() => {
          this.router.navigate(['/login']);
        }, 2000);
      } else {
        this.error = result.message || 'Failed to reset password. Please try again.';
      }
    }, 1000);
  }

  backToLogin() {
    this.router.navigate(['/login']);
  }
}
