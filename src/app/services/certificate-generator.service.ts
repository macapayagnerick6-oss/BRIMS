import { Injectable } from '@angular/core';
import html2canvas from 'html2canvas';
import jsPDF from 'jspdf';

export type CertificateExportFormat = 'pdf' | 'png';

@Injectable({
  providedIn: 'root',
})
export class CertificateGeneratorService {
  /**
   * Capture a DOM element and export it as a print-ready certificate
   * in either PDF or PNG format.
   */
  async export(
    element: HTMLElement,
    fileName: string,
    format: CertificateExportFormat = 'pdf',
  ): Promise<void> {
    if (!element) return;

    // Use a higher scale for sharper print quality
    const canvas = await html2canvas(element, {
      scale: 2,
      useCORS: true,
      backgroundColor: '#ffffff',
      logging: false,
    });

    const dataUrl = canvas.toDataURL('image/png');

    if (format === 'png') {
      const link = document.createElement('a');
      link.href = dataUrl;
      link.download = `${fileName}.png`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      return;
    }

    const pdf = new jsPDF('portrait', 'mm', 'a4');
    const pageWidth = pdf.internal.pageSize.getWidth();
    const pageHeight = pdf.internal.pageSize.getHeight();

    // Scale the captured image so it fully covers the A4 page
    // while preserving aspect ratio (our certificate is already A4-shaped).
    const imgProps = pdf.getImageProperties(dataUrl);
    const imgRatio = imgProps.width / imgProps.height;
    const pageRatio = pageWidth / pageHeight;

    let renderWidth = pageWidth;
    let renderHeight = pageHeight;

    if (imgRatio > pageRatio) {
      // Image is relatively wider than the page → fit height first
      renderHeight = pageHeight;
      renderWidth = imgRatio * renderHeight;
    } else if (imgRatio < pageRatio) {
      // Image is relatively taller than the page → fit width first
      renderWidth = pageWidth;
      renderHeight = renderWidth / imgRatio;
    }

    const offsetX = (pageWidth - renderWidth) / 2;
    const offsetY = (pageHeight - renderHeight) / 2;

    pdf.addImage(dataUrl, 'PNG', offsetX, offsetY, renderWidth, renderHeight);
    pdf.save(`${fileName}.pdf`);
  }
}

