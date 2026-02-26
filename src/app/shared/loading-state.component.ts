import { Component, EventEmitter, Input, Output } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-loading-state',
  standalone: true,
  imports: [CommonModule],
  template: `
    @if (loading) {
      <div class="loading-state loading-state--loading">
        <div class="loading-state__spinner"></div>
        <p class="loading-state__text">{{ loadingMessage }}</p>
      </div>
    } @else if (error) {
      <div class="loading-state loading-state--error">
        <div class="loading-state__icon" aria-hidden="true">
          <svg width="64" height="64" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path
              d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm1 15h-2v-2h2v2zm0-4h-2V7h2v6z"
              fill="currentColor"
            />
          </svg>
        </div>
        <h3 class="loading-state__title">{{ errorTitle }}</h3>
        <p class="loading-state__message">{{ error }}</p>
        @if (showRetry) {
          <button type="button" class="btn btn--primary" (click)="onRetryClick()">
            {{ retryLabel }}
          </button>
        }
      </div>
    }
  `,
  styles: [
    `
      .loading-state {
        display: flex;
        flex-direction: column;
        align-items: center;
        justify-content: center;
        padding: 2rem 1.5rem;
        text-align: center;
        color: var(--color-text, #111827);
      }

      .loading-state--loading {
        gap: 0.75rem;
      }

      .loading-state--error {
        gap: 1rem;
      }

      .loading-state__spinner {
        width: 32px;
        height: 32px;
        border-radius: 9999px;
        border: 3px solid var(--color-border, #e5e7eb);
        border-top-color: var(--color-primary, #2563eb);
        animation: loading-state-spin 0.8s linear infinite;
      }

      .loading-state__text {
        margin: 0;
        font-size: 0.9375rem;
        color: var(--color-text-muted, #6b7280);
      }

      .loading-state__icon {
        color: var(--color-danger, #ef4444);
        margin-bottom: 0.25rem;
      }

      .loading-state__title {
        margin: 0;
        font-weight: 600;
        font-size: 1rem;
      }

      .loading-state__message {
        margin: 0 0 0.75rem;
        font-size: 0.9375rem;
        color: var(--color-text-muted, #6b7280);
        max-width: 32rem;
      }

      @keyframes loading-state-spin {
        to {
          transform: rotate(360deg);
        }
      }
    `,
  ],
})
export class LoadingStateComponent {
  @Input() loading = false;
  @Input() error: string | null = null;
  @Input() loadingMessage = 'Loading...';
  @Input() errorTitle = 'Error';
  @Input() showRetry = false;
  @Input() retryLabel = 'Try again';

  @Output() retry = new EventEmitter<void>();

  onRetryClick(): void {
    this.retry.emit();
  }
}

