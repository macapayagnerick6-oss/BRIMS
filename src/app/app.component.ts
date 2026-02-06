import { Component, OnDestroy, OnInit } from '@angular/core';
import { NavigationEnd, Router, RouterOutlet } from '@angular/router';
import { DatePipe, NgClass } from '@angular/common';
import { Subscription } from 'rxjs';
import { AppNotification, NotificationService } from './services/notification.service';
import { NotificationTypeLabelPipe } from './services/notification-type-label.pipe';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [RouterOutlet, NgClass, DatePipe, NotificationTypeLabelPipe],
  template: `
    <router-outlet></router-outlet>

    @if (showGlobalUi) {
      <div class="global-notifications">
        <button
          class="global-notifications__bell"
          type="button"
          (click)="toggleNotifications()"
          [attr.aria-label]="'Notifications'"
          [attr.aria-expanded]="showNotifications"
        >
          <span class="global-notifications__icon" aria-hidden="true">🔔</span>
          @if (unreadCount > 0) {
            <span class="global-notifications__badge">{{ unreadCount > 9 ? '9+' : unreadCount }}</span>
          }
        </button>

        @if (showNotifications) {
          <div class="global-notifications__panel" role="dialog" [attr.aria-label]="'Notifications'">
            <div class="global-notifications__panelHeader">
              <span class="global-notifications__panelTitle">Notifications</span>
              @if (notifications.length) {
                <button
                  class="global-notifications__markAll"
                  type="button"
                  (click)="markAllAsRead()"
                >
                  Mark all as read
                </button>
              }
              <button
                class="global-notifications__close"
                type="button"
                (click)="closeNotifications()"
                [attr.aria-label]="'Close notifications'"
              >
                ✕
              </button>
            </div>
            <div class="global-notifications__panelBody">
              @if (!notifications.length) {
                <p class="global-notifications__empty">No notifications yet.</p>
              } @else {
                <ul class="global-notifications__list">
                  @for (n of notifications; track n.id) {
                    <li
                      class="global-notifications__item"
                      [ngClass]="{
                        'global-notifications__item--unread': !n.read,
                        'global-notifications__item--type-success': n.type === 'success',
                        'global-notifications__item--type-error': n.type === 'error',
                        'global-notifications__item--type-warning': n.type === 'warning'
                      }"
                      (click)="markAsRead(n.id)"
                    >
                      <div class="global-notifications__itemHeader">
                        <span class="global-notifications__itemTitle">
                          {{ n.title || (n.type | notificationTypeLabel) }}
                        </span>
                        <span class="global-notifications__itemTime">
                          {{ n.createdAt | date: 'shortTime' }}
                        </span>
                      </div>
                      <p class="global-notifications__itemMessage">
                        {{ n.message }}
                      </p>
                    </li>
                  }
                </ul>
              }
            </div>
          </div>
          <button
            class="global-notifications__backdrop"
            type="button"
            (click)="closeNotifications()"
            [attr.aria-label]="'Close notifications'"
            tabindex="-1"
          ></button>
        }
      </div>
    }
  `,
  styles: [
    `
      :host {
        display: block;
      }

      .global-notifications {
        position: fixed;
        top: 24px;
        right: 76px; /* left of profile icon (24 + 44 + 8) */
        z-index: 1100;
        
        @media (max-width: 640px) {
          top: 20px;
          right: 68px; /* 20 + 40 + 8 */
        }
      }

      .global-notifications__bell {
        position: relative;
        display: inline-flex;
        align-items: center;
        justify-content: center;
        width: 44px;
        height: 44px;
        border: 1px solid var(--color-border);
        border-radius: 9999px;
        background: var(--color-bg-card);
        color: var(--color-text);
        box-shadow: var(--shadow-lg);
        cursor: pointer;
        transition: background 0.2s, transform 0.05s;
        
        @media (max-width: 640px) {
          width: 40px;
          height: 40px;
        }
      }

      .global-notifications__bell:hover {
        background: var(--color-bg);
      }

      .global-notifications__bell:active {
        transform: translateY(1px);
      }

      .global-notifications__icon {
        font-size: 1.25rem;
        line-height: 1;
        filter: var(--notification-icon-filter);
      }

      .global-notifications__badge {
        position: absolute;
        top: 0;
        right: 0;
        transform: translate(35%, -35%);
        min-width: 18px;
        padding: 2px 6px;
        border-radius: 9999px;
        background: var(--color-warning);
        color: #fff;
        font-size: 0.75rem;
        font-weight: 700;
        text-align: center;
        line-height: 1.4;
        box-shadow: var(--shadow);
      }

      .global-notifications__panel {
        position: absolute;
        top: 52px;
        right: 0;
        width: min(360px, calc(100vw - 32px));
        background: var(--color-bg-card);
        border: 1px solid var(--color-border);
        border-radius: var(--radius-lg);
        box-shadow: var(--shadow-lg);
        overflow: hidden;
        z-index: 1102;
        
        @media (max-width: 640px) {
          top: 48px;
          right: -12px;
          width: calc(100vw - 24px);
          max-width: 360px;
        }
      }


      .global-notifications__panelHeader {
        display: flex;
        align-items: center;
        justify-content: space-between;
        padding: 12px 14px;
        border-bottom: 1px solid var(--color-border);
      }

      .global-notifications__panelTitle {
        font-weight: 600;
        color: var(--color-text);
      }

      .global-notifications__close {
        border: none;
        background: transparent;
        cursor: pointer;
        border-radius: var(--radius);
        padding: 6px 8px;
        color: var(--color-text-muted);
      }

      .global-notifications__close:hover {
        background: var(--color-bg);
        color: var(--color-text);
      }

      .global-notifications__panelBody {
        padding: 12px 14px;
      }

      .global-notifications__empty {
        margin: 0;
        color: var(--color-text-muted);
        font-size: 0.9375rem;
      }

      .global-notifications__backdrop {
        position: fixed;
        inset: 0;
        background: transparent;
        border: none;
        cursor: default;
        z-index: 1101;
      }
    `,
  ],
})
export class AppComponent implements OnInit, OnDestroy {
  title = 'Barangay Resident Information Management System';

  unreadCount = 0;
  showNotifications = false;
  showGlobalUi = true;
  notifications: AppNotification[] = [];

  private notificationsSub?: Subscription;

  constructor(
    private router: Router,
    private notificationsService: NotificationService,
  ) {
    this.updateGlobalUi(this.router.url);

    this.router.events.subscribe(event => {
      if (event instanceof NavigationEnd) {
        this.updateGlobalUi(event.urlAfterRedirects);
      }
    });
  }

  ngOnInit(): void {
    this.notificationsSub = this.notificationsService.notifications$.subscribe(list => {
      this.notifications = list;
      this.unreadCount = this.notificationsService.unreadCount;
    });
  }

  ngOnDestroy(): void {
    this.notificationsSub?.unsubscribe();
  }

  toggleNotifications() {
    this.showNotifications = !this.showNotifications;
  }

  closeNotifications() {
    this.showNotifications = false;
  }

  markAsRead(id: string) {
    this.notificationsService.markAsRead(id);
  }

  markAllAsRead() {
    this.notificationsService.markAllAsRead();
  }

  private updateGlobalUi(url: string) {
    // Hide on login page, forgot password page, reset password page, settings page,
    // form pages (add resident/add household), resident profile, request details page,
    // QR scanner page, and the full-screen household map page (maximize map space)
    const isStaffRequestDetailPage = url.startsWith('/staff/requests/') && url !== '/staff/requests';
    const isResidentRequestDetailPage = url.startsWith('/resident/requests/') && url !== '/resident/requests';
    const isResidentProfilePage = /^\/staff\/residents\/[^/]+$/.test(url); // e.g. /staff/residents/1
    const isQrScannerPage = url.includes('/qr-scanner');
    const isHouseholdMapPage = url.startsWith('/staff/households/map');
    this.showGlobalUi = !url.startsWith('/login') 
      && !url.startsWith('/forgot-password')
      && !url.startsWith('/reset-password')
      && !url.includes('/settings')
      && !url.includes('/residents/add')
      && !url.includes('/households/add')
      && !(url.includes('/households/') && url.includes('/edit'))
      && !isResidentProfilePage
      && !isStaffRequestDetailPage
      && !isResidentRequestDetailPage
      && !isQrScannerPage
      && !isHouseholdMapPage;
    if (!this.showGlobalUi) this.showNotifications = false;
  }
}
