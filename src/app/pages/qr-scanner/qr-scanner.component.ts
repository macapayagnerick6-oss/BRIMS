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
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: true });
      // Permission granted, stop the test stream
      stream.getTracks().forEach(track => track.stop());
      this.hasPermission = true;
      this.scannerEnabled = true;
    } catch (error: any) {
      this.hasPermission = false;
      this.scanError = 'Camera permission denied. Please enable camera access in your browser settings.';
      console.error('Camera permission error:', error);
    }
  }

  onCamerasFound(devices: MediaDeviceInfo[]): void {
    this.availableDevices = devices;
    // Prefer back camera on mobile devices
    const backCamera = devices.find(device => 
      device.label.toLowerCase().includes('back') || 
      device.label.toLowerCase().includes('rear') ||
      device.label.toLowerCase().includes('environment')
    );
    this.selectedDevice = backCamera || devices[0] || undefined;
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
    if (this.hasPermission) {
      console.error('Scan error:', error);
    }
  }

  onTorchCompatible(isCompatible: boolean): void {
    this.torchAvailable = isCompatible;
  }

  toggleTorch(): void {
    this.torchEnabled = !this.torchEnabled;
  }

  processScannedCode(code: string): void {
    try {
      // Try to parse as JSON first (for structured QR codes)
      let parsed: any;
      try {
        parsed = JSON.parse(code);
      } catch {
        parsed = null;
      }

      if (parsed) {
        // Handle structured QR codes
        if (parsed.type === 'resident') {
          const residentKey: string | undefined = parsed.id || parsed.residentId;
          if (residentKey) {
            const resident =
              this.data.getResidentById(residentKey) ||
              this.data.getResidentByResidentId(residentKey);

            if (resident) {
              this.router.navigate(['/staff/residents', resident.id]);
            } else {
              this.scanError = `Resident not found for ID "${residentKey}"`;
            }
            return;
          }
        }

        if (parsed.type === 'request' && parsed.id) {
          const request = this.data.getRequestById(parsed.id);
          if (request) {
            this.router.navigate(['/staff/requests', request.id]);
          } else {
            this.scanError = `Request not found for ID "${parsed.id}"`;
          }
          return;
        }

        if (parsed.type === 'certificate' && parsed.id) {
          // Certificates currently reuse request IDs
          const request = this.data.getRequestById(parsed.id);
          if (request) {
            this.router.navigate(['/staff/requests', request.id]);
          } else {
            this.scanError = `Certificate not found for ID "${parsed.id}"`;
          }
          return;
        }
      }

      // Handle simple resident identifiers (either internal id or residentId)
      const residentFromId =
        this.data.getResidentById(code) || this.data.getResidentByResidentId(code);
      if (residentFromId) {
        this.router.navigate(['/staff/residents', residentFromId.id]);
        return;
      }

      // Check if it's a request ID format
      if (code.startsWith('REQ-') || code.startsWith('req-')) {
        const requestId = code.replace(/^(REQ-|req-)/i, '');
        const request = this.data.getRequestById(requestId);
        if (request) {
          this.router.navigate(['/staff/requests', request.id]);
        } else {
          this.scanError = `Request not found for ID "${requestId}"`;
        }
        return;
      }

      // If no pattern matches, show the raw code
      this.scanError = `Unrecognized QR code format: ${code}`;
    } catch (error) {
      this.scanError = 'Error processing QR code';
      console.error('Process error:', error);
    }
  }

  resetScanner(): void {
    this.scanResult = null;
    this.scanError = null;
    this.scannerEnabled = true;
  }

  retryPermission(): void {
    this.requestCameraPermission();
  }
}
