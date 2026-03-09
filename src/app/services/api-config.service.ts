import { Injectable } from '@angular/core';
import { environment } from '../../environments/environment';

/** Runtime API config. Set by APP_INITIALIZER from assets/config.json if present. */
export const runtimeApiConfig: { apiBaseUrl: string } = {
  apiBaseUrl: environment.apiBaseUrl,
};

@Injectable({ providedIn: 'root' })
export class ApiConfigService {
  /** Backend base URL for notifications API (from config.json or environment). */
  get apiBaseUrl(): string {
    return runtimeApiConfig.apiBaseUrl || environment.apiBaseUrl;
  }

  /** True if the backend URL is still the placeholder (not configured for production). */
  get isPlaceholderUrl(): boolean {
    const u = this.apiBaseUrl || '';
    return (
      u.includes('YOUR_BACKEND') ||
      u === 'https://YOUR_BACKEND_URL' ||
      u === ''
    );
  }
}
