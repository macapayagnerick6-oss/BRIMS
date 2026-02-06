import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { AuthService } from '../../services/auth.service';
import { DataService, Resident } from '../../services/data.service';
import { QrCodeService } from '../../services/qr-code.service';
import { Subscription } from 'rxjs';

@Component({
  selector: 'app-my-profile',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './my-profile.component.html',
  styleUrls: ['./my-profile.component.scss'],
})
export class MyProfileComponent implements OnInit, OnDestroy {
  qrCodeDataUrl: string | null = null;
  showQRCode = false;
  /** Resolved resident so the view updates when residents load asynchronously. */
  resident: Resident | null = null;
  private sub?: Subscription;

  constructor(
    public auth: AuthService,
    public data: DataService,
    private qrCodeService: QrCodeService,
  ) {}

  private resolveResident(): Resident | null {
    const user = this.auth.currentUser;
    if (!user || user.role !== 'resident') return null;
    const idStr = user.id != null ? String(user.id) : '';
    const byId = idStr ? this.data.getResidentById(idStr) : undefined;
    if (byId) return byId;
    const email = user.email?.trim().toLowerCase();
    if (email) {
      return this.data.residents.find(
        (r) => r.email?.trim().toLowerCase() === email
      ) ?? null;
    }
    return null;
  }

  ngOnInit(): void {
    this.resident = this.resolveResident();
    this.sub = this.data.residentsObservable.subscribe(() => {
      this.resident = this.resolveResident();
    });
  }

  ngOnDestroy(): void {
    this.sub?.unsubscribe();
  }

  generateQRCode(): void {
    if (this.resident?.residentId) {
      try {
        this.qrCodeDataUrl = this.qrCodeService.generateResidentQRCode(this.resident.residentId);
      } catch (error) {
        console.error('Error generating QR code:', error);
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
}
