import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { AuthService } from '../../services/auth.service';

@Component({
  selector: 'app-resident-settings',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './resident-settings.component.html',
  styleUrls: ['./resident-settings.component.scss'],
})
export class ResidentSettingsComponent {
  constructor(public auth: AuthService) {}

  activeTab: 'account' | 'preferences' | 'privacy' = 'account';
  saved = false;
  error = '';

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
}
