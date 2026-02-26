import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { AuthService } from '../../services/auth.service';
import { DataService } from '../../services/data.service';

@Component({
  selector: 'app-resident-dashboard',
  standalone: true,
  imports: [CommonModule, RouterLink],
  templateUrl: './resident-dashboard.component.html',
  styleUrls: ['./resident-dashboard.component.scss'],
})
export class ResidentDashboardComponent {
  constructor(
    public auth: AuthService,
    public data: DataService,
  ) {}

  /** Only requests for the current logged-in resident. */
  get requests() {
    const user = this.auth.currentUser;
    if (!user || user.role !== 'resident') return [];
    const resident = this.data.getResidentById(user.id);
    return this.data.getRequestsByResidentId(resident?.residentId ?? '');
  }
}
