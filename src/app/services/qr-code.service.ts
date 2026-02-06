import { Injectable } from '@angular/core';
import { QRCodeWriter, BarcodeFormat, EncodeHintType } from '@zxing/library';

@Injectable({
  providedIn: 'root'
})
export class QrCodeService {
  private writer: QRCodeWriter;

  constructor() {
    this.writer = new QRCodeWriter();
  }

  /**
   * Generate QR code as data URL (for use in img src)
   */
  generateQRCodeDataURL(data: string, size: number = 256): string {
    try {
      const hints = new Map();
      hints.set(EncodeHintType.MARGIN, 2);

      const bitMatrix = this.writer.encode(data, BarcodeFormat.QR_CODE, size, size, hints);
      
      const canvas = document.createElement('canvas');
      canvas.width = size;
      canvas.height = size;
      const ctx = canvas.getContext('2d');
      
      if (!ctx) {
        throw new Error('Could not get canvas context');
      }

      // Fill white background
      ctx.fillStyle = '#FFFFFF';
      ctx.fillRect(0, 0, size, size);

      // Draw QR code
      ctx.fillStyle = '#000000';
      const cellSize = size / bitMatrix.getWidth();
      
      for (let x = 0; x < bitMatrix.getWidth(); x++) {
        for (let y = 0; y < bitMatrix.getHeight(); y++) {
          if (bitMatrix.get(x, y)) {
            ctx.fillRect(x * cellSize, y * cellSize, cellSize, cellSize);
          }
        }
      }

      return canvas.toDataURL('image/png');
    } catch (error) {
      console.error('Error generating QR code:', error);
      throw error;
    }
  }

  /**
   * Generate QR code for a resident
   */
  generateResidentQRCode(residentId: string): string {
    const data = JSON.stringify({
      type: 'resident',
      id: residentId,
      residentId,
    });
    return this.generateQRCodeDataURL(data);
  }

  /**
   * Generate QR code for a request
   */
  generateRequestQRCode(requestId: string): string {
    const data = JSON.stringify({
      type: 'request',
      id: requestId
    });
    return this.generateQRCodeDataURL(data);
  }

  /**
   * Generate QR code for a certificate
   */
  generateCertificateQRCode(certificateId: string): string {
    const data = JSON.stringify({
      type: 'certificate',
      id: certificateId
    });
    return this.generateQRCodeDataURL(data);
  }
}
