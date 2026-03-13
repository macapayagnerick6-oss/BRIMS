import { Injectable } from '@angular/core';
import html2canvas from 'html2canvas';
import jsPDF from 'jspdf';

export type CertificateExportFormat = 'pdf' | 'png';

export type CertificatePerson = {
  name?: string;
  civilStatus?: string;
  purok?: string;
  address?: string;
};

export type CertificateTextPayload = {
  requestType?: string;
  purpose?: string;
  dateIssued?: string;
  controlNo?: string;
  person?: CertificatePerson;
  barangayName?: string;
  municipality?: string;
  province?: string;
};

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
    textPayload?: CertificateTextPayload,
  ): Promise<void> {
    if (format === 'pdf' && textPayload) {
      this.exportPdfText(textPayload, fileName);
      return;
    }

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

  exportPdfText(payload: CertificateTextPayload, fileName: string): void {
    const doc = new jsPDF('portrait', 'mm', 'a4');
    const pageWidth = doc.internal.pageSize.getWidth();
    const pageHeight = doc.internal.pageSize.getHeight();

    const marginX = 16;
    const contentWidth = pageWidth - marginX * 2;

    // Optional page frame (removed: keep clean edges)
    doc.setDrawColor(40);

    let y = 22;

    const barangayName = payload.barangayName ?? 'Barangay Name';
    const municipality = payload.municipality ?? 'Municipality of Villanueva';
    const province = payload.province ?? 'Province of Misamis Oriental';

    doc.setFont('times', 'normal');
    doc.setFontSize(11);
    doc.text('Republic of the Philippines', pageWidth / 2, y, { align: 'center' });
    y += 5;
    doc.text(province, pageWidth / 2, y, { align: 'center' });
    y += 5;
    doc.text(municipality, pageWidth / 2, y, { align: 'center' });
    y += 5;
    doc.text(barangayName, pageWidth / 2, y, { align: 'center' });
    y += 5;
    doc.setLineWidth(0.3);
    doc.line(marginX, y, pageWidth - marginX, y);
    y += 6;
    doc.setFont('times', 'bold');
    doc.text('OFFICE OF THE PUNONG BARANGAY', pageWidth / 2, y, { align: 'center' });
    y += 14;

    const title = (payload.requestType ?? 'CERTIFICATE').toUpperCase();
    doc.setFontSize(18);
    doc.text(title, pageWidth / 2, y, { align: 'center' });
    y += 12;

    doc.setFont('times', 'bold');
    doc.setFontSize(12);
    doc.text('TO WHOM IT MAY CONCERN:', marginX, y);
    y += 10;

    const personName = payload.person?.name?.trim() || '____________________';
    const civilStatus = payload.person?.civilStatus?.trim() || 'single/married';
    const address =
      payload.person?.address?.trim()
      || `Purok ${payload.person?.purok?.trim() || '___'}, ${barangayName}, ${municipality}, ${province}`;

    const purpose = payload.purpose?.trim() || '____________________';
    const dateIssued = payload.dateIssued?.trim() || '______________';
    const controlNo = payload.controlNo?.trim() || '________';

    doc.setFont('times', 'normal');
    doc.setFontSize(12);

    const lineHeight = 7;

    // Paragraph 1 with bold name and address
    y = this.renderSegmentedParagraph(doc, marginX, y, contentWidth, lineHeight, [
      { text: 'This is to certify that ' },
      { text: personName.toUpperCase(), bold: true },
      { text: ', of legal age, ' },
      { text: civilStatus },
      { text: ', and a resident of ' },
      { text: address.toUpperCase(), bold: true },
      { text: ', is a bona fide resident of this barangay.' },
    ]) + 8;

    // Paragraph 2 with bold purpose
    y = this.renderSegmentedParagraph(doc, marginX, y, contentWidth, lineHeight, [
      {
        text: 'This certification is being issued upon the request of the above-named person for the purpose of ',
      },
      { text: purpose.toUpperCase(), bold: true },
      { text: '.' },
    ]) + 8;

    // Paragraph 3 (no highlights)
    const paragraph3 = `Issued this ${dateIssued} at ${barangayName}, ${municipality}, ${province}, Philippines.`;
    const lines3 = doc.splitTextToSize(paragraph3, contentWidth) as string[];
    doc.text(lines3, marginX, y);
    y += lines3.length * lineHeight + 8;

    // Footer: control no + signature
    const footerTop = Math.max(y, pageHeight - 60);
    doc.setFontSize(11);
    doc.setFont('times', 'normal');
    doc.text('Control No.:', marginX, footerTop);
    doc.setFont('times', 'bold');
    doc.text(controlNo, marginX + 28, footerTop);

    const sigX = pageWidth - marginX;
    const sigLineWidth = 60;
    const sigY = footerTop + 18;
    doc.setLineWidth(0.4);
    doc.line(sigX - sigLineWidth, sigY, sigX, sigY);
    doc.setFont('times', 'bold');
    doc.text('Punong Barangay', sigX - sigLineWidth / 2, sigY + 6, { align: 'center' });

    doc.save(`${fileName}.pdf`);
  }

  private renderSegmentedParagraph(
    doc: any,
    marginX: number,
    startY: number,
    contentWidth: number,
    lineHeight: number,
    segments: { text: string; bold?: boolean }[],
  ): number {
    let y = startY;
    let x = marginX;
    const maxX = marginX + contentWidth;

    type Token = { word: string; bold: boolean };
    const tokens: Token[] = [];

    segments.forEach(segment => {
      const text = segment.text ?? '';
      const bold = !!segment.bold;
      const parts = text.split(/(\s+)/); // keep spaces as separate tokens
      parts.forEach(part => {
        if (!part) return;
        tokens.push({ word: part, bold });
      });
    });

    tokens.forEach((token, index) => {
      if (!token.word) return;

      if (token.bold) {
        doc.setFont('times', 'bold');
      } else {
        doc.setFont('times', 'normal');
      }

      const width = doc.getTextWidth(token.word);

      if (x + width > maxX && index !== 0) {
        y += lineHeight;
        x = marginX;
      }

      doc.text(token.word, x, y);
      x += width;
    });

    return y;
  }
}

