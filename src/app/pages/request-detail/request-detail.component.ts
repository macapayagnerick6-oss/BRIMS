import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { DataService, CertificateRequest, Resident } from '../../services/data.service';
import { QrCodeService } from '../../services/qr-code.service';

@Component({
  selector: 'app-request-detail',
  standalone: true,
  imports: [CommonModule, RouterLink],
  templateUrl: './request-detail.component.html',
  styleUrls: ['./request-detail.component.scss'],
})
export class RequestDetailComponent implements OnInit {
  request: CertificateRequest | undefined;
  requester: Resident | undefined;
  qrCodeDataUrl: string | null = null;
  showQRCode = false;
  isUpdating = false;

  constructor(
    private route: ActivatedRoute,
    private data: DataService,
    private qrCodeService: QrCodeService,
  ) {
    // Initialize on first load
    const id = this.route.snapshot.paramMap.get('id');
    if (id) {
      this.request = this.data.getRequestById(id);
      if (this.request) {
        this.loadRequester();
      }
    }
  }

  ngOnInit() {
    // Handle route changes
    this.route.paramMap.subscribe(params => {
      const id = params.get('id');
      if (id) {
        this.request = this.data.getRequestById(id);
        if (this.request) {
          this.loadRequester();
          this.generateQRCode();
        } else {
          this.requester = undefined;
        }
      } else {
        this.request = undefined;
        this.requester = undefined;
        this.qrCodeDataUrl = null;
      }
    });
  }

  generateQRCode(): void {
    if (this.request?.id) {
      try {
        this.qrCodeDataUrl = this.qrCodeService.generateRequestQRCode(this.request.id);
      } catch (error) {
        console.error('Error generating QR code:', error);
        this.qrCodeDataUrl = null;
      }
    }
  }

  toggleQRCode(): void {
    this.showQRCode = !this.showQRCode;
    if (this.showQRCode && !this.qrCodeDataUrl && this.request?.id) {
      this.generateQRCode();
    }
  }

  downloadQRCode(): void {
    if (!this.qrCodeDataUrl) return;
    
    const link = document.createElement('a');
    link.href = this.qrCodeDataUrl;
    link.download = `request-${this.request?.id || 'qr'}-code.png`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  }

  private loadRequester(): void {
    if (this.request?.residentId) {
      this.requester = this.data.getResidentByResidentId(this.request.residentId);
    } else {
      this.requester = undefined;
    }
  }

  approveRequest(): void {
    if (!this.request || this.isUpdating) return;
    this.isUpdating = true;
    const id = this.request.id;
    this.data.updateRequest(id, { status: 'Approved' });
    this.request = { ...this.request, status: 'Approved' };
    this.isUpdating = false;
  }

  rejectRequest(): void {
    if (!this.request || this.isUpdating) return;
    this.isUpdating = true;
    const id = this.request.id;
    this.data.updateRequest(id, { status: 'Rejected' });
    this.request = { ...this.request, status: 'Rejected' };
    this.isUpdating = false;
  }
}
