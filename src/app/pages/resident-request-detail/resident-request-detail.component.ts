import { Component, OnInit, ElementRef, ViewChild } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { DataService, CertificateRequest, Resident } from '../../services/data.service';
import { AuthService } from '../../services/auth.service';
import { CertificateGeneratorService } from '../../services/certificate-generator.service';

@Component({
  selector: 'app-resident-request-detail',
  standalone: true,
  imports: [CommonModule, RouterLink],
  templateUrl: './resident-request-detail.component.html',
  styleUrls: ['./resident-request-detail.component.scss'],
})
export class ResidentRequestDetailComponent implements OnInit {
  request: CertificateRequest | undefined;
  resident: Resident | undefined;

  @ViewChild('certificateRef') certificateRef?: ElementRef<HTMLDivElement>;

  constructor(
    private route: ActivatedRoute,
    private data: DataService,
    private auth: AuthService,
    private certificateGenerator: CertificateGeneratorService,
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
        this.resident = undefined;
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
    this.resident = resident;
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

  async downloadCertificate(format: 'pdf' | 'png'): Promise<void> {
    if (!this.canDownload()) return;
    const ref = this.certificateRef?.nativeElement;
    if (!ref) return;
    const fileName = `certificate-${this.request?.id || 'barangay'}`;
    await this.certificateGenerator.export(ref, fileName, format);
  }
}
