import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { DataService, CertificateRequest } from '../../services/data.service';
import { AuthService } from '../../services/auth.service';

@Component({
  selector: 'app-requests',
  standalone: true,
  imports: [CommonModule, RouterLink],
  templateUrl: './requests.component.html',
  styles: ['.muted { color: var(--color-text-muted); } .table { margin-top: 1rem; }'],
})
export class RequestsComponent {
  constructor(public data: DataService, public auth: AuthService) {}

  // Only show active (non-archived) requests in the main list
  get requests(): CertificateRequest[] {
    return this.data.getActiveRequests();
  }

  get isAdmin(): boolean {
    return this.auth.currentUser?.role === 'admin';
  }

  archiveRequest(request: CertificateRequest): void {
    if (!this.isAdmin) return;
    // Prefer archiving once a request is in a final state
    if (request.status !== 'Approved' && request.status !== 'Rejected') {
      const proceed = confirm(
        'This request is not yet Approved or Rejected. Archive anyway?'
      );
      if (!proceed) return;
    } else {
      const confirmed = confirm(
        `Archive request "${request.type}" (${request.status})? It will move to Archives and be hidden from the main list.`
      );
      if (!confirmed) return;
    }
    this.data.archiveRequest(request.id);
  }
}

