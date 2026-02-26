import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { AuthService } from '../../services/auth.service';

@Component({
  selector: 'app-staff-profile',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './staff-profile.component.html',
  styleUrls: ['./staff-profile.component.scss'],
})
export class StaffProfileComponent {
  constructor(public auth: AuthService) {}

  get profilePictureUrl(): string | null {
    const u = this.auth.currentUser;
    return u ? this.auth.getProfilePicture(u.id) : null;
  }

  get displayName(): string {
    return this.auth.currentUser?.name ?? 'Staff';
  }
}
