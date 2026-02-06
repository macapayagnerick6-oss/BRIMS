import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable } from 'rxjs';

export type NotificationType = 'info' | 'success' | 'warning' | 'error';

export interface AppNotification {
  id: string;
  type: NotificationType;
  title?: string;
  message: string;
  createdAt: Date;
  read: boolean;
}

@Injectable({ providedIn: 'root' })
export class NotificationService {
  private readonly _notifications = new BehaviorSubject<AppNotification[]>([]);
  readonly notifications$: Observable<AppNotification[]> = this._notifications.asObservable();

  /** Number of unread notifications */
  get unreadCount(): number {
    return this._notifications.value.filter(n => !n.read).length;
  }

  /** Convenience methods for different notification types */
  info(message: string, title?: string) {
    this.add({ type: 'info', message, title });
  }

  success(message: string, title?: string) {
    this.add({ type: 'success', message, title });
  }

  warning(message: string, title?: string) {
    this.add({ type: 'warning', message, title });
  }

  error(message: string, title?: string) {
    this.add({ type: 'error', message, title });
  }

  /** Mark a notification as read */
  markAsRead(id: string) {
    const updated = this._notifications.value.map(n =>
      n.id === id ? { ...n, read: true } : n
    );
    this._notifications.next(updated);
  }

  /** Mark all notifications as read */
  markAllAsRead() {
    const updated = this._notifications.value.map(n => ({ ...n, read: true }));
    this._notifications.next(updated);
  }

  /** Clear all notifications */
  clear() {
    this._notifications.next([]);
  }

  /** Internal helper to add a notification */
  private add(input: { type: NotificationType; message: string; title?: string }) {
    const current = this._notifications.value;
    const notification: AppNotification = {
      id: `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
      type: input.type,
      title: input.title,
      message: input.message,
      createdAt: new Date(),
      read: false,
    };
    this._notifications.next([notification, ...current]);
  }
}

