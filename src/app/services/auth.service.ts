import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable } from 'rxjs';
import { ThemeService } from './theme.service';
import { DataService } from './data.service';
import { AuditLogService } from './audit-log.service';

export type UserRole = 'admin' | 'staff' | 'resident';

export interface User {
  id: string;
  name: string;
  email: string;
  role: UserRole;
}

const PROFILE_PICTURE_PREFIX = 'brims_profile_';

@Injectable({ providedIn: 'root' })
export class AuthService {
  private readonly STORAGE_KEY = 'brimms_user';
  private readonly currentProfilePicture$ = new BehaviorSubject<string | null>(null);

  constructor(
    private theme: ThemeService,
    private data: DataService,
    private audit: AuditLogService,
  ) {
    const raw = sessionStorage.getItem(this.STORAGE_KEY);
    if (raw) {
      try {
        const user = JSON.parse(raw) as User;
        const pic = this.getProfilePictureFromData(user?.id, user?.role) ?? this.getStoredProfilePicture(user?.id);
        if (pic) this.currentProfilePicture$.next(pic);
      } catch {
        // ignore
      }
    }
    this.data.residentsObservable.subscribe(() => this.syncCurrentUserProfilePicture());
    this.data.usersObservable.subscribe(() => this.syncCurrentUserProfilePicture());
  }

  private syncCurrentUserProfilePicture(): void {
    const u = this.currentUser;
    if (!u) return;
    const pic = this.getProfilePictureFromData(u.id, u.role) ?? this.getStoredProfilePicture(u.id);
    this.currentProfilePicture$.next(pic);
  }

  private getProfilePictureFromData(userId: string | undefined, role?: UserRole): string | null {
    if (!userId) return null;
    if (role === 'resident') {
      const r = this.data.getResidentById(userId);
      return r?.profilePicture ?? null;
    }
    if (role === 'staff' || role === 'admin') {
      const us = this.data.users.find(u => u.id === userId);
      return us?.profilePicture ?? null;
    }
    const r = this.data.getResidentById(userId);
    if (r?.profilePicture) return r.profilePicture;
    const us = this.data.users.find(u => u.id === userId);
    return us?.profilePicture ?? null;
  }

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
      this.currentProfilePicture$.next(resident.profilePicture ?? this.getStoredProfilePicture(user.id));
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
      const role: UserRole = staffOrAdmin.role === 'Admin' ? 'admin' : 'staff';
      const user: User = {
        id: staffOrAdmin.id,
        name: staffOrAdmin.name,
        email: staffOrAdmin.email,
        role,
      };
      sessionStorage.setItem(this.STORAGE_KEY, JSON.stringify(user));
      this.currentProfilePicture$.next(staffOrAdmin.profilePicture ?? this.getStoredProfilePicture(user.id));
      this.audit.log({
        action: 'Login',
        category: 'auth',
        userId: user.id,
        userName: user.name,
        userEmail: user.email,
        details: `${staffOrAdmin.role} logged in`,
      });
      return { success: true, role };
    }

    // 3. Fallback: demo accounts (any password) for first-time use
    if (normalizedEmail === 'staff@barangay.gov' && pwd) {
      const user: User = { id: '1', name: 'Staff User', email: normalizedEmail, role: 'staff' };
      sessionStorage.setItem(this.STORAGE_KEY, JSON.stringify(user));
      this.currentProfilePicture$.next(this.getStoredProfilePicture(user.id));
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
    if (normalizedEmail === 'admin@barangay.gov' && pwd) {
      const user: User = { id: '4', name: 'Admin User', email: normalizedEmail, role: 'admin' };
      sessionStorage.setItem(this.STORAGE_KEY, JSON.stringify(user));
      this.currentProfilePicture$.next(this.getStoredProfilePicture(user.id));
      this.audit.log({
        action: 'Login',
        category: 'auth',
        userId: user.id,
        userName: user.name,
        userEmail: user.email,
        details: 'Demo admin logged in',
      });
      return { success: true, role: 'admin' };
    }
    if (normalizedEmail === 'resident@email.com' && pwd) {
      const user: User = { id: '1', name: 'Juan Dela Cruz', email: normalizedEmail, role: 'resident' };
      sessionStorage.setItem(this.STORAGE_KEY, JSON.stringify(user));
      this.currentProfilePicture$.next(this.getStoredProfilePicture(user.id));
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
    this.currentProfilePicture$.next(null);
    this.theme.setTheme('light');
  }

  get currentUser(): User | null {
    const raw = sessionStorage.getItem(this.STORAGE_KEY);
    if (!raw) return null;
    try {
      return JSON.parse(raw) as User;
    } catch {
      // If stored data is corrupted, clear it to avoid runtime errors.
      sessionStorage.removeItem(this.STORAGE_KEY);
      return null;
    }
  }

  get isLoggedIn(): boolean {
    return !!this.currentUser;
  }

  /** Profile picture for the current user (reactive). */
  get profilePicture$(): Observable<string | null> {
    return this.currentProfilePicture$.asObservable();
  }

  get profilePictureUrl(): string | null {
    const u = this.currentUser;
    if (!u) return null;
    let v = this.currentProfilePicture$.value;
    if (v === null) {
      v = this.getProfilePictureFromData(u.id, u.role) ?? this.getStoredProfilePicture(u.id);
      if (v !== null) this.currentProfilePicture$.next(v);
    }
    return v;
  }

  /** Profile picture for a user – from shared data (visible to all who can see that account), then localStorage. */
  getProfilePicture(userId: string): string | null {
    if (!userId) return null;
    const pic = this.getProfilePictureFromData(userId, undefined);
    if (pic) return pic;
    try {
      return localStorage.getItem(PROFILE_PICTURE_PREFIX + userId);
    } catch {
      return null;
    }
  }

  setProfilePicture(userId: string, dataUrl: string): void {
    if (!userId) return;
    const u = this.currentUser;
    try {
      if (u?.role === 'resident') {
        this.data.updateResident(userId, { profilePicture: dataUrl });
      } else if (u?.role === 'staff' || u?.role === 'admin') {
        this.data.updateUser(userId, { profilePicture: dataUrl });
      } else {
        try {
          localStorage.setItem(PROFILE_PICTURE_PREFIX + userId, dataUrl);
        } catch (e) {
          console.warn('Failed to save profile picture', e);
        }
      }
      if (u?.id === userId) {
        this.currentProfilePicture$.next(dataUrl);
      }
    } catch (e) {
      console.warn('Failed to save profile picture', e);
    }
  }

  clearProfilePicture(userId: string): void {
    if (!userId) return;
    const u = this.currentUser;
    try {
      if (u?.role === 'resident') {
        this.data.updateResident(userId, { profilePicture: undefined });
      } else if (u?.role === 'staff' || u?.role === 'admin') {
        this.data.updateUser(userId, { profilePicture: undefined });
      }
      try {
        localStorage.removeItem(PROFILE_PICTURE_PREFIX + userId);
      } catch {
        // ignore
      }
      if (u?.id === userId) {
        this.currentProfilePicture$.next(null);
      }
    } catch (e) {
      console.warn('Failed to clear profile picture', e);
    }
  }

  private getStoredProfilePicture(userId: string): string | null {
    if (!userId) return null;
    try {
      return localStorage.getItem(PROFILE_PICTURE_PREFIX + userId);
    } catch {
      return null;
    }
  }

  forgotPassword(email: string): { success: boolean; message?: string } {
    // Demo: Check if email exists in our demo users
    const validEmails = ['staff@barangay.gov', 'admin@barangay.gov', 'resident@email.com'];
    
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
