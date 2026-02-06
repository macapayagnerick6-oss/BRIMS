import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { DataService, CertificateRequest } from '../../services/data.service';
import { AuthService } from '../../services/auth.service';

@Component({
  selector: 'app-resident-request-detail',
  standalone: true,
  imports: [CommonModule, RouterLink],
  templateUrl: './resident-request-detail.component.html',
  styleUrls: ['./resident-request-detail.component.scss'],
})
export class ResidentRequestDetailComponent implements OnInit {
  request: CertificateRequest | undefined;

  constructor(
    private route: ActivatedRoute,
    private data: DataService,
    private auth: AuthService,
  ) {
    const id = this.route.snapshot.paramMap.get('id');
    if (id) {
      this.request = this.getRequestIfOwned(id);
    }
  }

  ngOnInit() {
    this.route.paramMap.subscribe(params => {
      const id = params.get('id');
      if (id) {
        this.request = this.getRequestIfOwned(id);
      } else {
        this.request = undefined;
      }
    });
  }

  /** Only return the request if it belongs to the current resident. */
  private getRequestIfOwned(id: string): CertificateRequest | undefined {
    const req = this.data.getRequestById(id);
    if (!req) return undefined;
    const user = this.auth.currentUser;
    if (!user || user.role !== 'resident') return undefined;
    const resident = this.data.getResidentById(user.id);
    if (req.residentId !== resident?.residentId) return undefined;
    return req;
  }

  getStatusBadgeClass(status: string): string {
    if (status === 'Approved') return 'badge--success';
    if (status === 'Pending' || status === 'For Review' || status === 'Rejected') return 'badge--warning';
    return '';
  }

  getStatusIcon(status: string): string {
    if (status === 'Approved') return '✓';
    if (status === 'Pending') return '⏳';
    if (status === 'For Review') return '👁';
    if (status === 'Rejected') return '✗';
    return '📄';
  }

  canDownload(): boolean {
    return this.request?.status === 'Approved';
  }
}
