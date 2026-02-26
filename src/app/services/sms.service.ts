import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

export interface SmsPayload {
  to: string;
  message: string;
}

export interface BulkSmsPayload {
  recipients: string[];
  message: string;
}

export interface SmsResponse {
  success: boolean;
  notification?: any;
  providerId?: string;
  error?: string;
}

export interface BulkSmsResponse {
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
export class SmsService {
  private readonly http = inject(HttpClient);

  /**
   * Base URL of the backend SMS/notification API.
   * For development, this points to the local Node.js backend created under /backend.
   */
  private readonly apiBaseUrl = 'http://localhost:4000';

  sendSms(payload: SmsPayload): Observable<SmsResponse> {
    return this.http.post<SmsResponse>(`${this.apiBaseUrl}/api/notifications/sms`, payload);
  }

  sendBulkSms(payload: BulkSmsPayload): Observable<BulkSmsResponse> {
    return this.http.post<BulkSmsResponse>(`${this.apiBaseUrl}/api/notifications/sms/bulk`, payload);
  }
}

