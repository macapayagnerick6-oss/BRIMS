import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { AuthService } from '../../services/auth.service';

@Component({
  selector: 'app-settings',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './settings.component.html',
  styleUrls: ['./settings.component.scss'],
})
export class SettingsComponent {
  constructor(public auth: AuthService) {}

  activeTab: 'general' | 'account' | 'system' | 'security' = 'general';
  saved = false;
  error = '';

  // General Settings
  barangaySettings = {
    name: 'Municipality of Villanueva',
    province: 'Province of Misamis Oriental',
    address: 'Purok 2, Barangay Name, City Name',
    contact: '+63 917 123 4557',
    email: 'barangay@villanueva.gov.ph',
    website: 'www.villanueva.gov.ph',
  };

  // Account Settings
  accountSettings = {
    name: this.auth.currentUser?.name || '',
    email: this.auth.currentUser?.email || '',
    currentPassword: '',
    newPassword: '',
    confirmPassword: '',
  };

  // System Settings
  systemSettings = {
    enableNotifications: true,
    emailNotifications: true,
    smsNotifications: false,
    autoBackup: true,
    backupFrequency: 'daily',
    sessionTimeout: 30,
    dataRetention: 365,
  };

  // Security Settings
  securitySettings = {
    twoFactorAuth: false,
    requireStrongPassword: true,
    loginAttempts: 5,
    lockoutDuration: 15,
    auditLogging: true,
  };

  setActiveTab(tab: 'general' | 'account' | 'system' | 'security'): void {
    this.activeTab = tab;
    this.saved = false;
    this.error = '';
  }

  saveGeneralSettings(): void {
    // Simulate save
    this.saved = true;
    setTimeout(() => {
      this.saved = false;
    }, 3000);
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

  saveSystemSettings(): void {
    // Simulate save
    this.saved = true;
    setTimeout(() => {
      this.saved = false;
    }, 3000);
  }

  saveSecuritySettings(): void {
    // Simulate save
    this.saved = true;
    setTimeout(() => {
      this.saved = false;
    }, 3000);
  }
}
