import { Component, OnInit, ElementRef, ViewChild } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { DataService, CertificateRequest, Resident } from '../../services/data.service';
import { QrCodeService } from '../../services/qr-code.service';
import { CertificateGeneratorService } from '../../services/certificate-generator.service';

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

  @ViewChild('certificateRef') certificateRef?: ElementRef<HTMLDivElement>;

  constructor(
    private route: ActivatedRoute,
    private data: DataService,
    private qrCodeService: QrCodeService,
    private certificateGenerator: CertificateGeneratorService,
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
        // QR code service handles error notification
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

  canDownload(): boolean {
    return this.request?.status === 'Approved';
  }

  async downloadCertificate(format: 'pdf' | 'png'): Promise<void> {
    if (!this.canDownload()) return;
    const ref = this.certificateRef?.nativeElement;
    if (!ref) return;
    const fileName = `certificate-${this.request?.id || 'barangay'}`;
    if (format === 'pdf') {
      this.certificateGenerator.exportPdfText(
        {
          requestType: this.request?.type,
          purpose: this.request?.purpose,
          dateIssued: this.request?.date,
          controlNo: this.request?.id,
          person: {
            name: this.requester?.name,
            civilStatus: this.requester?.civilStatus,
            purok: this.requester?.purok,
            address: this.requester?.address,
          },
        },
        fileName,
      );
      return;
    }

    await this.certificateGenerator.export(ref, fileName, format);
  }
}
