import { Pipe, PipeTransform } from '@angular/core';
import { NotificationType } from './notification.service';

@Pipe({
  name: 'notificationTypeLabel',
  standalone: true,
})
export class NotificationTypeLabelPipe implements PipeTransform {
  transform(type: NotificationType | null | undefined): string {
    switch (type) {
      case 'success':
        return 'Success';
      case 'warning':
        return 'Warning';
      case 'error':
        return 'Error';
      case 'info':
      default:
        return 'Notification';
    }
  }
}

