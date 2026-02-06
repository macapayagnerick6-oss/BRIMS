import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { SmsService, SmsResponse, BulkSmsResponse } from '../../services/sms.service';
import { EmailService, EmailResponse } from '../../services/email.service';
import { NotificationService } from '../../services/notification.service';
import { DataService } from '../../services/data.service';

type NotificationTab = 'sms' | 'email';

@Component({
  selector: 'app-admin-sms-broadcast',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './admin-sms-broadcast.component.html',
  styleUrls: ['./admin-sms-broadcast.component.scss'],
})
export class AdminSmsBroadcastComponent {
  activeTab: NotificationTab = 'sms';

  phone = '';
  message = '';
  isSending = false;

  email = '';
  subject = '';
  emailMessage = '';
  isSendingEmail = false;

  emailAttachmentBase64: string | null = null;
  emailAttachmentName: string | null = null;
  emailAttachmentMimeType: string | null = null;

  broadcastSmsToAllResidents = false;
  broadcastEmailToAllResidents = false;

  constructor(
    private sms: SmsService,
    private emailService: EmailService,
    private notifications: NotificationService,
    private data: DataService,
  ) {}

  setActiveTab(tab: NotificationTab) {
    this.activeTab = tab;
  }

  get smsBroadcastCount(): number {
    return this.data.residents.filter(r => !!r.contact?.trim()).length;
  }

  get emailBroadcastCount(): number {
    return this.data.residents.filter(r => !!r.email?.trim()).length;
  }

  onEmailFileSelected(event: Event) {
    const input = event.target as HTMLInputElement;
    const file = input.files?.[0];
    if (!file) {
      this.emailAttachmentBase64 = null;
      this.emailAttachmentName = null;
      this.emailAttachmentMimeType = null;
      return;
    }

    const reader = new FileReader();
    reader.onload = () => {
      const result = reader.result as string;
      const base64 = result.split(',')[1] || result;
      this.emailAttachmentBase64 = base64;
      this.emailAttachmentName = file.name;
      this.emailAttachmentMimeType = file.type || null;
    };
    reader.readAsDataURL(file);
  }

  clearEmailAttachment() {
    this.emailAttachmentBase64 = null;
    this.emailAttachmentName = null;
    this.emailAttachmentMimeType = null;
  }

  sendSms() {
    const trimmedMessage = this.message.trim();

    this.isSending = true;
    
    if (this.broadcastSmsToAllResidents) {
      if (!trimmedMessage) {
        this.notifications.warning('Please enter a message to broadcast.', 'Missing information');
        this.isSending = false;
        return;
      }

      const recipients = this.data.residents
        .map(r => r.contact?.trim())
        .filter((c): c is string => !!c);

      if (!recipients.length) {
        this.notifications.warning('No residents with contact numbers found.', 'No recipients');
        this.isSending = false;
        return;
      }

      this.sms.sendBulkSms({ recipients, message: trimmedMessage }).subscribe({
        next: (res: BulkSmsResponse) => {
          if (res.success) {
            const successCount = res.results.filter(r => r.success).length;
            const failCount = res.results.length - successCount;
            const summary =
              failCount > 0
                ? `SMS sent to ${successCount} resident(s). ${failCount} failed.`
                : `SMS sent to ${successCount} resident(s).`;
            this.notifications.success(summary, 'SMS Broadcast');
            this.message = '';
          } else {
            this.notifications.error(res.results?.length ? 'Some SMS messages failed.' : 'Failed to send SMS broadcast.', 'SMS Error');
          }
        },
        error: (err) => {
          console.error('SMS broadcast error', err);
          this.notifications.error('An error occurred while sending SMS broadcast.', 'SMS Error');
        },
        complete: () => {
          this.isSending = false;
        },
      });
    } else {
      const trimmedPhone = this.phone.trim();

      if (!trimmedPhone || !trimmedMessage) {
        this.notifications.warning('Please enter both phone number and message.', 'Missing information');
        this.isSending = false;
        return;
      }

      this.sms.sendSms({ to: trimmedPhone, message: trimmedMessage }).subscribe({
        next: (res: SmsResponse) => {
          if (res.success) {
            this.notifications.success('SMS sent successfully.', 'SMS Notification');
            this.phone = '';
            this.message = '';
          } else {
            this.notifications.error(res.error || 'Failed to send SMS.', 'SMS Error');
          }
        },
        error: (err) => {
          console.error('SMS send error', err);
          this.notifications.error('An error occurred while sending SMS.', 'SMS Error');
        },
        complete: () => {
          this.isSending = false;
        },
      });
    }
  }

  sendEmail() {
    const trimmedEmail = this.email.trim();
    const trimmedSubject = this.subject.trim();
    const trimmedMessage = this.emailMessage.trim();

    this.isSendingEmail = true;

    if (this.broadcastEmailToAllResidents) {
      if (!trimmedSubject || !trimmedMessage) {
        this.notifications.warning('Please enter subject and message to broadcast.', 'Missing information');
        this.isSendingEmail = false;
        return;
      }

      const recipients = this.data.residents
        .map(r => r.email?.trim())
        .filter((e): e is string => !!e);

      if (!recipients.length) {
        this.notifications.warning('No residents with email addresses found.', 'No recipients');
        this.isSendingEmail = false;
        return;
      }

      this.emailService
        .sendBulkEmail({
          recipients,
          subject: trimmedSubject,
          message: trimmedMessage,
          attachmentName: this.emailAttachmentName || undefined,
          attachmentContent: this.emailAttachmentBase64 || undefined,
          attachmentMimeType: this.emailAttachmentMimeType || undefined,
        })
        .subscribe({
          next: (res: import('../../services/email.service').BulkEmailResponse) => {
            if (res.success) {
              const successCount = res.results.filter(r => r.success).length;
              const failCount = res.results.length - successCount;
              const summary =
                failCount > 0
                  ? `Email sent to ${successCount} resident(s). ${failCount} failed.`
                  : `Email sent to ${successCount} resident(s).`;
              this.notifications.success(summary, 'Email Broadcast');
              this.subject = '';
              this.emailMessage = '';
            } else {
              this.notifications.error(res.results?.length ? 'Some emails failed.' : 'Failed to send email broadcast.', 'Email Error');
            }
          },
          error: (err) => {
            console.error('Email broadcast error', err);
            this.notifications.error('An error occurred while sending email broadcast.', 'Email Error');
          },
          complete: () => {
            this.isSendingEmail = false;
          },
        });
    } else {
      if (!trimmedEmail || !trimmedSubject || !trimmedMessage) {
        this.notifications.warning('Please enter email, subject, and message.', 'Missing information');
        this.isSendingEmail = false;
        return;
      }

      this.emailService
        .sendEmail({
          to: trimmedEmail,
          subject: trimmedSubject,
          message: trimmedMessage,
          attachmentName: this.emailAttachmentName || undefined,
          attachmentContent: this.emailAttachmentBase64 || undefined,
          attachmentMimeType: this.emailAttachmentMimeType || undefined,
        })
        .subscribe({
          next: (res: EmailResponse) => {
            if (res.success) {
              this.notifications.success('Email sent successfully.', 'Email Notification');
              this.email = '';
              this.subject = '';
              this.emailMessage = '';
            } else {
              this.notifications.error(res.error || 'Failed to send email.', 'Email Error');
            }
          },
          error: (err) => {
            console.error('Email send error', err);
            this.notifications.error('An error occurred while sending email.', 'Email Error');
          },
          complete: () => {
            this.isSendingEmail = false;
          },
        });
    }
  }
}

