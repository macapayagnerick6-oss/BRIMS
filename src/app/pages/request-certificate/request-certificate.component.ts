import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { DataService } from '../../services/data.service';
import { AuthService } from '../../services/auth.service';

@Component({
  selector: 'app-request-certificate',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink],
  templateUrl: './request-certificate.component.html',
  styleUrls: ['./request-certificate.component.scss'],
})
export class RequestCertificateComponent {
  constructor(
    public data: DataService,
    private auth: AuthService,
  ) {}

  docType = 'Barangay Clearance';
  purpose = '';

  /** Only requests for the current logged-in resident. */
  get requests() {
    const user = this.auth.currentUser;
    if (!user || user.role !== 'resident') return [];
    const resident = this.data.getResidentById(user.id);
    return this.data.getRequestsByResidentId(resident?.residentId ?? '');
  }

  submitted = false;

  submit() {
    const user = this.auth.currentUser;
    if (!user || user.role !== 'resident') {
      return;
    }

    const resident = this.data.getResidentById(user.id);
    if (!resident) {
      return;
    }

    const trimmedPurpose = this.purpose.trim() || 'Submitted from resident portal';
    const id = this.nextRequestId();
    const date = this.formatDate(new Date());

    this.data.addRequest({
      id,
      type: this.docType,
      purpose: trimmedPurpose,
      status: 'Pending',
      date,
      residentId: resident.residentId,
    });

    this.submitted = true;
    this.purpose = '';
  }

  getStatusClass(status: string): string {
    const s = (status || '').toLowerCase();
    if (s.includes('approved')) return 'status-badge--success';
    if (s.includes('pending')) return 'status-badge--warning';
    if (s.includes('review')) return 'status-badge--info';
    return 'status-badge--default';
  }

  private nextRequestId(): string {
    const ids = this.data.requests
      .map((r) => parseInt(r.id, 10))
      .filter((n) => !Number.isNaN(n));
    const max = ids.length ? Math.max(...ids) : 0;
    return String(max + 1);
  }

  private formatDate(d: Date): string {
    const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    return `${months[d.getMonth()]} ${d.getDate()}, ${d.getFullYear()}`;
  }
}
