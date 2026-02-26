import { ErrorHandler, Injectable, Injector } from '@angular/core';
import { NotificationService } from './notification.service';

export interface ErrorContext {
  component?: string;
  action?: string;
  userId?: string;
  additionalInfo?: Record<string, any>;
}

/**
 * Global Error Handler Service
 * 
 * Handles all unhandled errors in the application and provides:
 * - User-facing error messages
 * - Error logging
 * - Error recovery suggestions
 * - Context-aware error handling
 */
@Injectable({ providedIn: 'root' })
export class ErrorHandlerService implements ErrorHandler {
  private notificationService: NotificationService | null = null;

  constructor(private injector: Injector) {}

  private getNotificationService(): NotificationService | null {
    if (!this.notificationService) {
      try {
        this.notificationService = this.injector.get(NotificationService);
      } catch {
        // NotificationService not available yet (during bootstrap)
        return null;
      }
    }
    return this.notificationService;
  }

  handleError(error: any): void {
    // Extract error message
    const errorMessage = this.extractErrorMessage(error);
    const errorTitle = this.extractErrorTitle(error);
    
    // Log to console for debugging (still useful for developers)
    console.error('Global error handler:', error);
    
    // Show user-facing notification if NotificationService is available
    const notificationService = this.getNotificationService();
    if (notificationService) {
      notificationService.error(
        errorMessage,
        errorTitle || 'An Error Occurred'
      );
    } else {
      // Fallback: show browser alert during bootstrap phase
      console.warn('NotificationService not available, error:', errorMessage);
    }

    // In production, you might want to send errors to a logging service
    // this.logToExternalService(error);
  }

  /**
   * Handle errors with context for better user messages
   */
  handleErrorWithContext(error: any, context: ErrorContext): void {
    const errorMessage = this.getContextualErrorMessage(error, context);
    const errorTitle = this.getContextualErrorTitle(error, context);
    
    console.error(`Error in ${context.component || 'unknown'}:`, error);
    
    const notificationService = this.getNotificationService();
    if (notificationService) {
      notificationService.error(errorMessage, errorTitle);
    }
  }

  /**
   * Extract user-friendly error message from various error types
   */
  private extractErrorMessage(error: any): string {
    // HTTP errors
    if (error?.error?.message) {
      return error.error.message;
    }
    if (error?.error?.error) {
      return error.error.error;
    }
    
    // Network errors
    if (error?.status === 0 || error?.name === 'HttpErrorResponse') {
      return 'Unable to connect to the server. Please check your internet connection and try again.';
    }
    
    // HTTP status codes
    if (error?.status) {
      return this.getHttpErrorMessage(error.status);
    }
    
    // Standard Error objects
    if (error?.message) {
      return error.message;
    }
    
    // String errors
    if (typeof error === 'string') {
      return error;
    }
    
    // Default fallback
    return 'An unexpected error occurred. Please try again or contact support if the problem persists.';
  }

  /**
   * Extract error title from error
   */
  private extractErrorTitle(error: any): string {
    if (error?.error?.title) {
      return error.error.title;
    }
    
    if (error?.status === 0) {
      return 'Connection Error';
    }
    
    if (error?.status) {
      return this.getHttpErrorTitle(error.status);
    }
    
    return 'Error';
  }

  /**
   * Get contextual error message based on component/action
   */
  private getContextualErrorMessage(error: any, context: ErrorContext): string {
    const baseMessage = this.extractErrorMessage(error);
    
    if (context.action) {
      return `Failed to ${context.action}. ${baseMessage}`;
    }
    
    return baseMessage;
  }

  /**
   * Get contextual error title
   */
  private getContextualErrorTitle(error: any, context: ErrorContext): string {
    if (context.action) {
      return `${context.action} Failed`;
    }
    
    return this.extractErrorTitle(error);
  }

  /**
   * Get user-friendly HTTP error messages
   */
  private getHttpErrorMessage(status: number): string {
    const messages: Record<number, string> = {
      400: 'Invalid request. Please check your input and try again.',
      401: 'You are not authorized to perform this action. Please log in again.',
      403: 'You do not have permission to perform this action.',
      404: 'The requested resource was not found.',
      409: 'This action conflicts with existing data. Please refresh and try again.',
      422: 'The data you provided is invalid. Please check your input.',
      429: 'Too many requests. Please wait a moment and try again.',
      500: 'A server error occurred. Please try again later or contact support.',
      502: 'The server is temporarily unavailable. Please try again later.',
      503: 'The service is temporarily unavailable. Please try again later.',
      504: 'The request timed out. Please try again.',
    };
    
    return messages[status] || `An error occurred (${status}). Please try again.`;
  }

  /**
   * Get HTTP error titles
   */
  private getHttpErrorTitle(status: number): string {
    const titles: Record<number, string> = {
      400: 'Invalid Request',
      401: 'Unauthorized',
      403: 'Access Denied',
      404: 'Not Found',
      409: 'Conflict',
      422: 'Validation Error',
      429: 'Too Many Requests',
      500: 'Server Error',
      502: 'Bad Gateway',
      503: 'Service Unavailable',
      504: 'Timeout',
    };
    
    return titles[status] || 'Error';
  }
}
