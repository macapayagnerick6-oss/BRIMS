import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { AuthService } from '../../services/auth.service';

@Component({
  selector: 'app-staff-settings',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './staff-settings.component.html',
  styleUrls: ['./staff-settings.component.scss'],
})
export class StaffSettingsComponent {
  constructor(public auth: AuthService) {}

  activeTab: 'account' | 'preferences' | 'privacy' = 'account';
  saved = false;
  error = '';

  /** Current saved profile picture for the logged-in staff. */
  get profilePictureUrl(): string | null {
    const u = this.auth.currentUser;
    return u ? this.auth.getProfilePicture(u.id) : null;
  }

  /** Pending (unsaved) profile picture data URL; shown as preview until Save. */
  pendingProfilePicture: string | null = null;

  /** Preview to show in avatar: pending if set, otherwise saved. */
  get displayPictureUrl(): string | null {
    return this.pendingProfilePicture ?? this.profilePictureUrl;
  }

  get hasPendingChanges(): boolean {
    return this.pendingProfilePicture !== null;
  }

  // Account Settings
  accountSettings = {
    name: this.auth.currentUser?.name || '',
    email: this.auth.currentUser?.email || '',
    currentPassword: '',
    newPassword: '',
    confirmPassword: '',
  };

  // Preferences
  preferences = {
    enableNotifications: true,
    emailNotifications: true,
    smsNotifications: false,
    notifyOnRequestStatus: true,
    notifyOnRequestApproval: true,
    notifyOnRequestRejection: true,
  };

  // Privacy Settings
  privacySettings = {
    profileVisibility: 'barangay' as 'public' | 'barangay' | 'private',
    allowDataSharing: true,
    showContactInfo: true,
    twoFactorAuth: false,
    loginAlerts: true,
  };

  setActiveTab(tab: 'account' | 'preferences' | 'privacy'): void {
    this.activeTab = tab;
    this.saved = false;
    this.error = '';
  }

  saveAccountSettings(): void {
    if (this.accountSettings.newPassword && this.accountSettings.newPassword !== this.accountSettings.confirmPassword) {
      this.error = 'New passwords do not match.';
      return;
    }

    if (this.accountSettings.newPassword && this.accountSettings.newPassword.length < 8) {
      this.error = 'Password must be at least 8 characters long.';
      return;
    }

    // Simulate save
    this.error = '';
    this.saved = true;
    this.accountSettings.currentPassword = '';
    this.accountSettings.newPassword = '';
    this.accountSettings.confirmPassword = '';
    
    setTimeout(() => {
      this.saved = false;
    }, 3000);
  }

  savePreferences(): void {
    // Simulate save
    this.saved = true;
    setTimeout(() => {
      this.saved = false;
    }, 3000);
  }

  savePrivacySettings(): void {
    // Simulate save
    this.saved = true;
    setTimeout(() => {
      this.saved = false;
    }, 3000);
  }

  onProfilePhotoSelected(event: Event): void {
    const input = event.target as HTMLInputElement;
    const file = input?.files?.[0];
    if (!file || !file.type.startsWith('image/')) return;
    const reader = new FileReader();
    reader.onload = async () => {
      const dataUrl = reader.result as string;
      const resized = await this.resizeImageDataUrl(dataUrl, 400);
      this.pendingProfilePicture = resized;
      input.value = '';
    };
    reader.readAsDataURL(file);
  }

  saveProfilePicture(): void {
    const userId = this.auth.currentUser?.id;
    if (!userId || this.pendingProfilePicture === null) return;
    this.auth.setProfilePicture(userId, this.pendingProfilePicture);
    this.pendingProfilePicture = null;
  }

  cancelPendingPhoto(): void {
    this.pendingProfilePicture = null;
  }

  removeProfilePhoto(): void {
    const userId = this.auth.currentUser?.id;
    if (userId) this.auth.clearProfilePicture(userId);
    this.pendingProfilePicture = null;
  }

  private resizeImageDataUrl(dataUrl: string, maxSize: number): Promise<string> {
    return new Promise((resolve) => {
      const img = new Image();
      img.onload = () => {
        let w = img.width;
        let h = img.height;
        if (w <= maxSize && h <= maxSize) {
          resolve(dataUrl);
          return;
        }
        if (w > h) {
          h = Math.round((h * maxSize) / w);
          w = maxSize;
        } else {
          w = Math.round((w * maxSize) / h);
          h = maxSize;
        }
        const canvas = document.createElement('canvas');
        canvas.width = w;
        canvas.height = h;
        const ctx = canvas.getContext('2d');
        if (!ctx) {
          resolve(dataUrl);
          return;
        }
        ctx.drawImage(img, 0, 0, w, h);
        try {
          resolve(canvas.toDataURL('image/jpeg', 0.85));
        } catch {
          resolve(dataUrl);
        }
      };
      img.onerror = () => resolve(dataUrl);
      img.src = dataUrl;
    });
  }
}
