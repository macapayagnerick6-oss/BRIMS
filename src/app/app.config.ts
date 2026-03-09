import { ApplicationConfig, ErrorHandler, APP_INITIALIZER, provideZoneChangeDetection } from '@angular/core';
import { provideRouter } from '@angular/router';
import { provideHttpClient, withInterceptors } from '@angular/common/http';
import { provideCharts, withDefaultRegisterables } from 'ng2-charts';
import { provideFirebaseApp, initializeApp } from '@angular/fire/app';
import { provideFirestore, getFirestore } from '@angular/fire/firestore';
import { routes } from './app.routes';
import { ErrorHandlerService } from './services/error-handler.service';
import { httpErrorInterceptor } from './interceptors/http-error.interceptor';
import { DATABASE_SERVICE } from './services/database.interface';
import { FirebaseDatabaseService } from './services/firebase-database.service';
import { runtimeApiConfig } from './services/api-config.service';
import { environment } from '../environments/environment';

/** Load assets/config.json at startup and override apiBaseUrl for production. */
function loadApiConfig(): () => Promise<void> {
  return () =>
    fetch('assets/config.json')
      .then((r) => (r.ok ? r.json() : {}))
      .then((config: { apiBaseUrl?: string }) => {
        if (config?.apiBaseUrl?.trim()) {
          runtimeApiConfig.apiBaseUrl = config.apiBaseUrl.trim().replace(/\/+$/, '');
        }
      })
      .catch(() => {});
}

export const appConfig: ApplicationConfig = {
  providers: [
    { provide: APP_INITIALIZER, useFactory: loadApiConfig, multi: true },
    provideZoneChangeDetection({ eventCoalescing: true }),
    provideRouter(routes),
    provideFirebaseApp(() => initializeApp(environment.firebase)),
    provideFirestore(() => getFirestore()),
    provideHttpClient(
      withInterceptors([httpErrorInterceptor])
    ),
    provideCharts(withDefaultRegisterables()),
    { provide: ErrorHandler, useClass: ErrorHandlerService },
    { provide: DATABASE_SERVICE, useClass: FirebaseDatabaseService },
  ],
};