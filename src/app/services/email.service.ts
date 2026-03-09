import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { ApiConfigService } from './api-config.service';

export interface EmailPayload {
  to: string;
  subject: string;
  message: string;
  attachmentName?: string;
  attachmentContent?: string; // base64
  attachmentMimeType?: string;
}

export interface BulkEmailPayload {
  recipients: string[];
  subject: string;
  message: string;
  attachmentName?: string;
  attachmentContent?: string; // base64
  attachmentMimeType?: string;
}

export interface EmailResponse {
  success: boolean;
  notification?: any;
  providerId?: string;
  error?: string;
}

export interface BulkEmailResponse {
  success: boolean;
  results: Array<{
    to: string;
    success: boolean;
    providerId?: string;
    error?: string;
    notificationId?: string;
  }>;
}

@Injectable({ providedIn: 'root' })
export class EmailService {
  private readonly http = inject(HttpClient);
  private readonly apiConfig = inject(ApiConfigService);
  private get apiBaseUrl(): string {
    return this.apiConfig.apiBaseUrl;
  }

  sendEmail(payload: EmailPayload): Observable<EmailResponse> {
    return this.http.post<EmailResponse>(`${this.apiBaseUrl}/api/notifications/email`, payload);
  }

  sendBulkEmail(payload: BulkEmailPayload): Observable<BulkEmailResponse> {
    return this.http.post<BulkEmailResponse>(`${this.apiBaseUrl}/api/notifications/email/bulk`, payload);
  }

  /** Use for bulk email with a file attachment (avoids sending large base64 in JSON). */
  sendBulkEmailWithAttachment(
    recipients: string[],
    subject: string,
    message: string,
    file: File
  ): Observable<BulkEmailResponse> {
    const form = new FormData();
    form.append('recipients', JSON.stringify(recipients));
    form.append('subject', subject);
    form.append('message', message);
    form.append('attachment', file, file.name);
    return this.http.post<BulkEmailResponse>(`${this.apiBaseUrl}/api/notifications/email/bulk`, form);
  }
}

