import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { DataService } from '../../services/data.service';
import { AuthService } from '../../services/auth.service';

@Component({
  selector: 'app-resident-reports',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './resident-reports.component.html',
  styleUrls: ['./resident-reports.component.scss'],
})
export class ResidentReportsComponent {
  activeTab: string = 'requests';

  constructor(
    public data: DataService,
    public auth: AuthService
  ) {}

  setActiveTab(tab: string) {
    this.activeTab = tab;
  }

  /** Current resident's requests only. */
  getMyRequests() {
    const user = this.auth.currentUser;
    if (!user || user.role !== 'resident') return [];
    const resident = this.data.getResidentById(user.id);
    return this.data.getRequestsByResidentId(resident?.residentId ?? '');
  }

  // Get request statistics for current resident
  getMyRequestStats() {
    const requests = this.getMyRequests();
    const total = requests.length;
    const approved = requests.filter(r => r.status === 'Approved').length;
    const pending = requests.filter(r => r.status === 'Pending').length;
    const forReview = requests.filter(r => r.status === 'For Review').length;

    return {
      total,
      approved,
      pending,
      forReview
    };
  }

}
