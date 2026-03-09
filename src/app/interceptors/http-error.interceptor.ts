import { HttpInterceptorFn, HttpErrorResponse } from '@angular/common/http';
import { inject } from '@angular/core';
import { catchError, retry, throwError, timer } from 'rxjs';
import { NotificationService } from '../services/notification.service';
import { ErrorHandlerService } from '../services/error-handler.service';
import { ApiConfigService } from '../services/api-config.service';

/**
 * HTTP Error Interceptor
 * 
 * Intercepts HTTP errors and:
 * - Provides user-facing error messages
 * - Implements retry logic for transient errors
 * - Handles network errors gracefully
 * - Logs errors appropriately
 */
export const httpErrorInterceptor: HttpInterceptorFn = (req, next) => {
  const notificationService = inject(NotificationService);
  const errorHandler = inject(ErrorHandlerService);
  const apiConfig = inject(ApiConfigService);

  // Determine retry configuration based on request
  const isNotificationApi = req.url.includes('/api/notifications/');
  const shouldRetry = (error: HttpErrorResponse): boolean => {
    // Don't retry connection errors for notifications - fail fast for clearer feedback
    if (isNotificationApi && error.status === 0) return false;
    // Retry on network errors or 5xx server errors (except 501)
    if (error.status === 0) return true;
    if (error.status >= 500 && error.status !== 501) return true;
    return false;
  };

  const maxRetries = 2;
  const retryDelay = 1000; // 1 second

  return next(req).pipe(
    retry({
      count: maxRetries,
      delay: (error: HttpErrorResponse, retryCount: number) => {
        if (shouldRetry(error) && retryCount <= maxRetries) {
          return timer(retryDelay * retryCount);
        }
        return throwError(() => error);
      },
    }),
    catchError((error: HttpErrorResponse) => {
      // Don't show notification for 401 errors (handled by auth service)
      if (error.status === 401) {
        return throwError(() => error);
      }

      // Handle different error types
      let errorMessage = 'An error occurred while processing your request.';
      let errorTitle = 'Request Failed';

      if (error.status === 0) {
        // Network error (often in production: wrong backend URL or CORS)
        if (apiConfig.isPlaceholderUrl) {
          errorMessage =
            'Backend URL is not set. Set apiBaseUrl in src/assets/config.json to your backend URL (no trailing slash), then redeploy.';
          errorTitle = 'Backend Not Configured';
        } else {
          errorMessage =
            'Cannot reach the notification server. Check that the backend is running and CORS allows this site. In production, set apiBaseUrl in assets/config.json.';
          errorTitle = 'Connection Error';
        }
      } else if (error.error?.message) {
        errorMessage = error.error.message;
      } else if (error.error?.error) {
        errorMessage = error.error.error;
      } else if (error.status >= 500) {
        errorMessage = 'A server error occurred. Please try again later.';
        errorTitle = 'Server Error';
      } else if (error.status === 404) {
        errorMessage = 'The requested resource was not found.';
        errorTitle = 'Not Found';
      } else if (error.status === 403) {
        errorMessage = 'You do not have permission to perform this action.';
        errorTitle = 'Access Denied';
      } else if (error.status === 400) {
        errorMessage = error.error?.message || 'Invalid request. Please check your input.';
        errorTitle = 'Invalid Request';
      } else if (error.status === 409) {
        errorMessage = 'This action conflicts with existing data. Please refresh and try again.';
        errorTitle = 'Conflict';
      } else if (error.status === 422) {
        errorMessage = error.error?.message || 'The data you provided is invalid.';
        errorTitle = 'Validation Error';
      } else if (error.status === 429) {
        errorMessage = 'Too many requests. Please wait a moment and try again.';
        errorTitle = 'Too Many Requests';
      } else if (error.status === 413) {
        errorMessage = error.error?.error || 'The email or attachment is too large. Try sending without attachment or use a smaller file.';
        errorTitle = 'Request Too Large';
      }

      // Show user-facing notification
      notificationService.error(errorMessage, errorTitle);

      // Log error for debugging
      console.error('HTTP Error:', {
        url: req.url,
        status: error.status,
        statusText: error.statusText,
        error: error.error,
      });

      return throwError(() => error);
    })
  );
};
