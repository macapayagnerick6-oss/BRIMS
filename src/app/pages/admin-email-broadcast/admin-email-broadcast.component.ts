import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { EmailService, EmailResponse } from '../../services/email.service';
import { NotificationService } from '../../services/notification.service';

@Component({
  selector: 'app-admin-email-broadcast',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './admin-email-broadcast.component.html',
  styleUrls: ['./admin-email-broadcast.component.scss'],
})
export class AdminEmailBroadcastComponent {
  email = '';
  subject = '';
  message = '';
  isSending = false;

  constructor(
    private emailService: EmailService,
    private notifications: NotificationService,
  ) {}

  send() {
    const trimmedEmail = this.email.trim();
    const trimmedSubject = this.subject.trim();
    const trimmedMessage = this.message.trim();

    if (!trimmedEmail || !trimmedSubject || !trimmedMessage) {
      this.notifications.warning('Please enter email, subject, and message.', 'Missing information');
      return;
    }

    this.isSending = true;

    this.emailService.sendEmail({
      to: trimmedEmail,
      subject: trimmedSubject,
      message: trimmedMessage,
    }).subscribe({
      next: (res: EmailResponse) => {
        if (res.success) {
          this.notifications.success('Email sent successfully.', 'Email Notification');
          this.email = '';
          this.subject = '';
          this.message = '';
        } else {
          this.notifications.error(res.error || 'Failed to send email.', 'Email Error');
        }
      },
      error: (err) => {
        console.error('Email send error', err);
        this.notifications.error('An error occurred while sending email.', 'Email Error');
      },
      complete: () => {
        this.isSending = false;
      },
    });
  }
}

