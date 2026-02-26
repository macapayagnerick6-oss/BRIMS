import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { DataService, CertificateRequest } from '../../services/data.service';
import { AuthService } from '../../services/auth.service';
import Swal from 'sweetalert2';

@Component({
  selector: 'app-requests',
  standalone: true,
  imports: [CommonModule, RouterLink],
  templateUrl: './requests.component.html',
  styles: [
    `
      .muted {
        color: var(--color-text-muted);
      }

      .table {
        margin-top: 1rem;
      }

      .table th:last-child {
        text-align: left;
        white-space: nowrap;
      }

      .actions-cell {
        text-align: left;
        white-space: nowrap;
      }

      .actions-cell__buttons {
        display: inline-flex;
        align-items: center;
        justify-content: flex-end;
        gap: 0.5rem;
      }

      /* Avoid double horizontal scrollbars on mobile for this page */
      .requests-page .table-wrap {
        overflow-x: auto;
        margin: 0;
        padding: 0;
      }
    `,
  ],
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

  async archiveRequest(request: CertificateRequest): Promise<void> {
    if (!this.isAdmin) return;
    // Prefer archiving once a request is in a final state
    if (request.status !== 'Approved' && request.status !== 'Rejected') {
      const result = await Swal.fire({
        title: 'Archive request?',
        text: 'This request is not yet Approved or Rejected. Archive anyway?',
        icon: 'warning',
        showCancelButton: true,
        confirmButtonText: 'Yes, archive',
        cancelButtonText: 'Cancel',
      });
      if (!result.isConfirmed) return;
    } else {
      const result = await Swal.fire({
        title: 'Archive request?',
        text: `Archive request "${request.type}" (${request.status})? It will move to Archives and be hidden from the main list.`,
        icon: 'question',
        showCancelButton: true,
        confirmButtonText: 'Yes, archive',
        cancelButtonText: 'Cancel',
      });
      if (!result.isConfirmed) return;
    }
    this.data.archiveRequest(request.id);
    await Swal.fire({
      title: 'Archived',
      text: 'The request has been moved to Archives.',
      icon: 'success',
      timer: 1500,
      showConfirmButton: false,
    });
  }
}

