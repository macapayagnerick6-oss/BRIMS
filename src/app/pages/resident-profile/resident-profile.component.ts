import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { DataService, Household, Resident, CertificateRequest } from '../../services/data.service';
import { QrCodeService } from '../../services/qr-code.service';
import { Subscription } from 'rxjs';

const CERTIFICATE_TYPES = ['Barangay Clearance', 'Certificate of Residency', 'Request Clearance'];

@Component({
  selector: 'app-resident-profile',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink],
  templateUrl: './resident-profile.component.html',
  styleUrls: ['./resident-profile.component.scss'],
})
export class ResidentProfileComponent implements OnInit, OnDestroy {
  resident: Resident | undefined;
  household: Household | undefined;
  activeTab = 'personal';
  qrCodeDataUrl: string | null = null;
  showQRCode = false;

  /** Generate certificate modal */
  showGenerateCertificate = false;
  certificateType = 'Barangay Clearance';
  certificatePurpose = '';
  generateSuccess = false;
  createdRequestId: string | null = null;
  certificateTypes = CERTIFICATE_TYPES;

  /** Which field is currently being edited: 'name' | 'contact' | 'email' | 'address' */
  editingField: 'name' | 'contact' | 'email' | 'address' | null = null;
  editValue = '';

  private routeResidentId: string | null = null;
  private residentsSub?: Subscription;

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private data: DataService,
    private qrCodeService: QrCodeService,
  ) {}

  ngOnInit() {
    // Watch route param changes
    this.route.paramMap.subscribe(params => {
      this.routeResidentId = params.get('id');
      this.loadResidentFromData();
      this.cancelEdit();
    });

    // React to data loading (important when page is opened directly in a new tab)
    this.residentsSub = this.data.residentsObservable.subscribe(() => {
      this.loadResidentFromData();
    });
  }

  ngOnDestroy(): void {
    this.residentsSub?.unsubscribe();
  }

  generateQRCode(): void {
    if (this.resident?.residentId) {
      try {
        this.qrCodeDataUrl = this.qrCodeService.generateResidentQRCode(this.resident.residentId);
      } catch (error) {
        // QR code service handles error notification
        this.qrCodeDataUrl = null;
      }
    }
  }

  toggleQRCode(): void {
    this.showQRCode = !this.showQRCode;
    if (this.showQRCode && !this.qrCodeDataUrl && this.resident?.residentId) {
      this.generateQRCode();
    }
  }

  downloadQRCode(): void {
    if (!this.qrCodeDataUrl) return;
    
    const link = document.createElement('a');
    link.href = this.qrCodeDataUrl;
    link.download = `resident-${this.resident?.residentId || 'qr'}-code.png`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  }

  private loadResidentFromData(): void {
    const id = this.routeResidentId;
    if (id) {
      // Try both id and residentId lookups
      this.resident = this.data.getResidentById(id) || this.data.getResidentByResidentId(id);
      if (this.resident) {
        this.household = this.data.getHouseholdByResidentId(this.resident.residentId);
        this.generateQRCode();
      } else {
        this.household = undefined;
        this.qrCodeDataUrl = null;
      }
    } else {
      this.resident = undefined;
      this.household = undefined;
      this.qrCodeDataUrl = null;
    }
  }

  startEdit(field: 'name' | 'contact' | 'email' | 'address'): void {
    if (!this.resident) return;
    this.editingField = field;
    if (field === 'name') this.editValue = this.resident.name;
    else if (field === 'contact') this.editValue = this.resident.contact ?? '';
    else if (field === 'email') this.editValue = this.resident.email ?? '';
    else this.editValue = this.resident.address ?? '';
  }

  saveEdit(): void {
    if (!this.resident || !this.editingField) return;
    const trimmed = this.editValue.trim();
    if (this.editingField === 'name' && !trimmed) return;
    this.data.updateResident(this.resident.id, {
      ...(this.editingField === 'name' && { name: trimmed }),
      ...(this.editingField === 'contact' && { contact: trimmed || undefined }),
      ...(this.editingField === 'email' && { email: trimmed || undefined }),
      ...(this.editingField === 'address' && { address: trimmed || undefined }),
    });
    this.cancelEdit();
  }

  cancelEdit(): void {
    this.editingField = null;
    this.editValue = '';
  }

  openGenerateCertificate(): void {
    this.showGenerateCertificate = true;
    this.generateSuccess = false;
    this.createdRequestId = null;
    this.certificateType = 'Barangay Clearance';
    this.certificatePurpose = '';
  }

  closeGenerateCertificate(): void {
    this.showGenerateCertificate = false;
    this.generateSuccess = false;
    this.createdRequestId = null;
  }

  submitGenerateCertificate(): void {
    if (!this.resident) return;
    const purpose = this.certificatePurpose.trim() || 'Issued from resident profile';
    const id = this.nextRequestId();
    const date = this.formatDate(new Date());
    const request: CertificateRequest = {
      id,
      type: this.certificateType,
      purpose,
      status: 'Approved',
      date,
      residentId: this.resident.residentId,
    };
    this.data.addRequest(request);
    this.createdRequestId = id;
    this.generateSuccess = true;
  }

  /** Resolve residents list URL so "Back to Residents" works from both admin and staff. */
  get residentsListUrl(): string {
    const base = this.router.url.startsWith('/admin') ? '/admin' : '/staff';
    return `${base}/residents`;
  }

  /** Get the request detail URL for a given request ID, works from both admin and staff. */
  getRequestDetailUrl(requestId: string): string {
    const base = this.router.url.startsWith('/admin') ? '/admin' : '/staff';
    return `${base}/requests/${requestId}`;
  }

  goToCreatedRequest(): void {
    if (this.createdRequestId) {
      this.closeGenerateCertificate();
      const isAdminPath = this.router.url.startsWith('/admin');
      const base = isAdminPath ? '/admin' : '/staff';
      this.router.navigate([base, 'requests', this.createdRequestId]);
    }
  }

  get residentRequests(): CertificateRequest[] {
    return this.resident?.residentId
      ? this.data.getRequestsByResidentId(this.resident.residentId)
      : [];
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
