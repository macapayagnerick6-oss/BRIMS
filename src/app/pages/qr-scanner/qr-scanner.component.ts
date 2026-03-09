import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterLink } from '@angular/router';
import { ZXingScannerModule } from '@zxing/ngx-scanner';
import { BarcodeFormat, Result } from '@zxing/library';
import { DataService } from '../../services/data.service';

@Component({
  selector: 'app-qr-scanner',
  standalone: true,
  imports: [CommonModule, RouterLink, ZXingScannerModule],
  templateUrl: './qr-scanner.component.html',
  styleUrls: ['./qr-scanner.component.scss'],
})
export class QrScannerComponent implements OnInit, OnDestroy {
  scannerEnabled = false;
  hasPermission = false;
  availableDevices: MediaDeviceInfo[] = [];
  selectedDevice: MediaDeviceInfo | undefined = undefined;
  scanResult: string | null = null;
  scanResultUrl: string | null = null;
  scanError: string | null = null;
  allowedFormats = [BarcodeFormat.QR_CODE];
  torchEnabled = false;
  torchAvailable = false;

  constructor(
    private router: Router,
    private data: DataService,
  ) {}

  ngOnInit() {
    this.requestCameraPermission();
  }

  ngOnDestroy() {
    this.scannerEnabled = false;
  }

  async requestCameraPermission() {
    const strategies: MediaStreamConstraints[] = [
      { video: true },
      { video: { facingMode: 'user' } },
      { video: { facingMode: 'environment' } },
      { video: { width: { ideal: 1280 }, height: { ideal: 720 } } },
    ];

    for (const constraints of strategies) {
      try {
        const stream = await navigator.mediaDevices.getUserMedia(constraints);
        stream.getTracks().forEach(track => track.stop());
        this.hasPermission = true;
        this.scannerEnabled = true;
        this.scanError = null;
        return;
      } catch (error: any) {
        const errorName = error?.name || '';
        if (errorName === 'NotAllowedError' || errorName === 'PermissionDeniedError') {
          this.hasPermission = false;
          this.scanError = 'Camera permission denied. Please enable camera access in your browser settings.';
          return;
        }
        if (errorName === 'NotFoundError' || errorName === 'DevicesNotFoundError') {
          continue;
        }
        if (errorName === 'NotReadableError' || errorName === 'TrackStartError') {
          this.hasPermission = false;
          this.scanError = 'Camera is already in use by another application.';
          return;
        }
      }
    }

    this.hasPermission = false;
    this.scanError = this.scanError || 'No camera found. Try closing other apps using the camera, or use Chrome settings (chrome://settings/content/camera) to select your webcam.';
  }

  onCamerasFound(devices: MediaDeviceInfo[]): void {
    this.availableDevices = devices.filter(d => d.kind === 'videoinput');
    const label = (d: MediaDeviceInfo) => (d.label || '').toLowerCase();
    const backCamera = this.availableDevices.find(d =>
      label(d).includes('back') || label(d).includes('rear') || label(d).includes('environment')
    );
    this.selectedDevice = backCamera || this.availableDevices[0] || undefined;
  }

  onDeviceSelectChange(deviceId: string) {
    this.selectedDevice = this.availableDevices.find(device => device.deviceId === deviceId) || undefined;
  }

  onScanSuccess(result: Result | string): void {
    // Handle both Result object and string
    const text = typeof result === 'string' ? result : result.getText();
    this.scanResult = text;
    this.scanError = null;
    if (this.scanResult) {
      this.processScannedCode(this.scanResult);
    }
  }

  onScanError(error: any): void {
    // Only show error if it's not a permission issue (already handled)
    if (this.hasPermission && !this.scanError) {
      this.scanError = 'An error occurred while scanning. Please try again.';
    }
  }

  onTorchCompatible(isCompatible: boolean): void {
    this.torchAvailable = isCompatible;
  }

  toggleTorch(): void {
    this.torchEnabled = !this.torchEnabled;
  }

  private openRouteInNewTab(commands: any[]): void {
    if (typeof window === 'undefined') {
      this.router.navigate(commands);
      return;
    }

    const urlTree = this.router.createUrlTree(commands);
    const url = this.router.serializeUrl(urlTree);
    window.open(url, '_blank');
  }

  processScannedCode(code: string): void {
    try {
      this.scanResultUrl = null;

      // Try to parse as JSON first (for structured QR codes)
      let parsed: any;
      try {
        parsed = JSON.parse(code);
      } catch {
        parsed = null;
      }

      const isAdminPath = this.router.url.startsWith('/admin');
      const base = isAdminPath ? '/admin' : '/staff';

      if (parsed) {
        // Handle structured QR codes
        if (parsed.type === 'resident') {
          const residentKey: string | undefined = parsed.id || parsed.residentId;
          if (residentKey) {
            const resident =
              this.data.getResidentById(residentKey) ||
              this.data.getResidentByResidentId(residentKey);

            if (resident) {
              this.openRouteInNewTab([base, 'residents', resident.id]);
            } else {
              this.scanError = `Resident not found for ID "${residentKey}"`;
            }
            return;
          }
        }

        if (parsed.type === 'request' && parsed.id) {
          const request = this.data.getRequestById(parsed.id);
          if (request) {
            this.openRouteInNewTab([base, 'requests', request.id]);
          } else {
            this.scanError = `Request not found for ID "${parsed.id}"`;
          }
          return;
        }

        if (parsed.type === 'certificate' && parsed.id) {
          // Certificates currently reuse request IDs
          const request = this.data.getRequestById(parsed.id);
          if (request) {
            this.openRouteInNewTab([base, 'requests', request.id]);
          } else {
            this.scanError = `Certificate not found for ID "${parsed.id}"`;
          }
          return;
        }
      }

      // Handle simple resident identifiers or URL-like codes
      const trimmedCode = code.trim();

      // Try to interpret the scanned code as a URL
      let urlToOpen: string | null = null;

      // Already a full http/https URL
      if (/^https?:\/\/\S+/i.test(trimmedCode)) {
        urlToOpen = trimmedCode;
      }
      // Starts with www. or looks like a domain (e.g. example.com/path)
      else if (
        /^www\.\S+/i.test(trimmedCode) ||
        /^[a-z0-9.-]+\.[a-z]{2,}(\S*)?$/i.test(trimmedCode)
      ) {
        urlToOpen = `https://${trimmedCode}`;
      }

      if (urlToOpen) {
        this.scanResultUrl = urlToOpen;
        if (typeof window !== 'undefined') {
          try {
            window.open(urlToOpen, '_blank');
          } catch {
            // If the browser blocks the popup, the user can still click the link in the UI.
          }
        }
        return;
      }

      const residentFromId =
        this.data.getResidentById(code) || this.data.getResidentByResidentId(code);
      if (residentFromId) {
        this.openRouteInNewTab([base, 'residents', residentFromId.id]);
        return;
      }

      // Check if it's a request ID format
      if (code.startsWith('REQ-') || code.startsWith('req-')) {
        const requestId = code.replace(/^(REQ-|req-)/i, '');
        const request = this.data.getRequestById(requestId);
        if (request) {
          this.openRouteInNewTab([base, 'requests', request.id]);
        } else {
          this.scanError = `Request not found for ID "${requestId}"`;
        }
        return;
      }

      // If no pattern matches, show the raw code
      this.scanError = `Unrecognized QR code format: ${code}`;
    } catch (error) {
      this.scanError = 'Error processing QR code. Please try scanning again.';
    }
  }

  resetScanner(): void {
    this.scanResult = null;
    this.scanResultUrl = null;
    this.scanError = null;
    this.scannerEnabled = true;
  }

  retryPermission(): void {
    this.requestCameraPermission();
  }
}
