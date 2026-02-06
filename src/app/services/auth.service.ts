import { Injectable } from '@angular/core';
import { ThemeService } from './theme.service';
import { DataService } from './data.service';
import { AuditLogService } from './audit-log.service';

export type UserRole = 'staff' | 'resident';

export interface User {
  id: string;
  name: string;
  email: string;
  role: UserRole;
}

@Injectable({ providedIn: 'root' })
export class AuthService {
  private readonly STORAGE_KEY = 'brimms_user';

  constructor(
    private theme: ThemeService,
    private data: DataService,
    private audit: AuditLogService,
  ) {}

  login(email: string, password: string): { success: boolean; role?: UserRole } {
    const normalizedEmail = email?.trim().toLowerCase() ?? '';
    const pwd = password ?? '';

    // 1. Check residents created by admin (email + password from Add Resident)
    const resident = this.data.residents.find(
      (r) => r.email?.trim().toLowerCase() === normalizedEmail
    );
    if (resident?.password === pwd) {
      const user: User = {
        id: resident.id,
        name: resident.name,
        email: resident.email ?? normalizedEmail,
        role: 'resident',
      };
      sessionStorage.setItem(this.STORAGE_KEY, JSON.stringify(user));
      this.audit.log({
        action: 'Login',
        category: 'auth',
        userId: user.id,
        userName: user.name,
        userEmail: user.email,
        details: 'Resident logged in',
      });
      return { success: true, role: 'resident' };
    }

    // 2. Check staff/admin users created in Users & Roles (email + password)
    const staffOrAdmin = this.data.users.find(
      (u) =>
        u.email?.trim().toLowerCase() === normalizedEmail &&
        (u.role === 'Staff' || u.role === 'Admin') &&
        u.status === 'Active'
    );
    if (staffOrAdmin && staffOrAdmin.password === pwd) {
      const user: User = {
        id: staffOrAdmin.id,
        name: staffOrAdmin.name,
        email: staffOrAdmin.email,
        role: 'staff',
      };
      sessionStorage.setItem(this.STORAGE_KEY, JSON.stringify(user));
      this.audit.log({
        action: 'Login',
        category: 'auth',
        userId: user.id,
        userName: user.name,
        userEmail: user.email,
        details: 'Staff/Admin logged in',
      });
      return { success: true, role: 'staff' };
    }

    // 3. Fallback: demo accounts (any password) for first-time use
    if (normalizedEmail === 'staff@barangay.gov' && pwd) {
      const user: User = { id: '1', name: 'Staff User', email: normalizedEmail, role: 'staff' };
      sessionStorage.setItem(this.STORAGE_KEY, JSON.stringify(user));
      this.audit.log({
        action: 'Login',
        category: 'auth',
        userId: user.id,
        userName: user.name,
        userEmail: user.email,
        details: 'Demo staff logged in',
      });
      return { success: true, role: 'staff' };
    }
    if (normalizedEmail === 'resident@email.com' && pwd) {
      const user: User = { id: '1', name: 'Juan Dela Cruz', email: normalizedEmail, role: 'resident' };
      sessionStorage.setItem(this.STORAGE_KEY, JSON.stringify(user));
      this.audit.log({
        action: 'Login',
        category: 'auth',
        userId: user.id,
        userName: user.name,
        userEmail: user.email,
        details: 'Demo resident logged in',
      });
      return { success: true, role: 'resident' };
    }

    return { success: false };
  }

  logout(): void {
    const user = this.currentUser;
    if (user) {
      this.audit.log({
        action: 'Logout',
        category: 'auth',
        userId: user.id,
        userName: user.name,
        userEmail: user.email,
        details: 'User logged out',
      });
    }
    sessionStorage.removeItem(this.STORAGE_KEY);
    this.theme.setTheme('light');
  }

  get currentUser(): User | null {
    const raw = sessionStorage.getItem(this.STORAGE_KEY);
    return raw ? JSON.parse(raw) : null;
  }

  get isLoggedIn(): boolean {
    return !!this.currentUser;
  }

  forgotPassword(email: string): { success: boolean; message?: string } {
    // Demo: Check if email exists in our demo users
    const validEmails = ['staff@barangay.gov', 'resident@email.com'];
    
    if (!validEmails.includes(email)) {
      // In a real app, you might still return success to prevent email enumeration
      // For demo purposes, we'll be more explicit
      return { success: false, message: 'Email not found in our system.' };
    }

    // Generate a simple reset token (in production, use a secure random token)
    const resetToken = this.generateResetToken();
    
    // Store reset token temporarily (in production, store in database with expiration)
    const resetData = {
      email,
      token: resetToken,
      expiresAt: Date.now() + 3600000, // 1 hour from now
    };
    
    sessionStorage.setItem(`reset_token_${email}`, JSON.stringify(resetData));
    
    // In a real app, send email with reset link
    // For demo: log the reset link
    console.log(`Reset link for ${email}: /reset-password?token=${resetToken}&email=${encodeURIComponent(email)}`);
    
    return { success: true };
  }

  resetPassword(token: string, email: string, newPassword: string): { success: boolean; message?: string } {
    // Retrieve reset token from storage
    const resetDataStr = sessionStorage.getItem(`reset_token_${email}`);
    
    if (!resetDataStr) {
      return { success: false, message: 'Invalid or expired reset token.' };
    }

    const resetData = JSON.parse(resetDataStr);
    
    // Check if token matches
    if (resetData.token !== token) {
      return { success: false, message: 'Invalid reset token.' };
    }

    // Check if token has expired
    if (Date.now() > resetData.expiresAt) {
      sessionStorage.removeItem(`reset_token_${email}`);
      return { success: false, message: 'Reset token has expired. Please request a new one.' };
    }

    // In a real app, update password in database
    // For demo: just remove the reset token
    sessionStorage.removeItem(`reset_token_${email}`);
    
    // Log password reset (in production, update database)
    console.log(`Password reset for ${email} completed successfully.`);
    
    return { success: true };
  }

  private generateResetToken(): string {
    // Simple token generation for demo (in production, use crypto.randomBytes or similar)
    return Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15);
  }
}
