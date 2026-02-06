import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

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
  private readonly apiBaseUrl = 'http://localhost:4000';

  sendEmail(payload: EmailPayload): Observable<EmailResponse> {
    return this.http.post<EmailResponse>(`${this.apiBaseUrl}/api/notifications/email`, payload);
  }

  sendBulkEmail(payload: BulkEmailPayload): Observable<BulkEmailResponse> {
    return this.http.post<BulkEmailResponse>(`${this.apiBaseUrl}/api/notifications/email/bulk`, payload);
  }
}

