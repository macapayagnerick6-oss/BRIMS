import { ApplicationConfig, ErrorHandler, provideZoneChangeDetection } from '@angular/core';
import { provideRouter } from '@angular/router';
import { provideHttpClient, withInterceptors } from '@angular/common/http';
import { provideCharts, withDefaultRegisterables } from 'ng2-charts';
import { routes } from './app.routes';
import { ErrorHandlerService } from './services/error-handler.service';
import { httpErrorInterceptor } from './interceptors/http-error.interceptor';
import { DATABASE_SERVICE } from './services/database.interface';
import { LocalStorageDatabaseService } from './services/local-storage-database.service';
import { JsonServerDatabaseService } from './services/json-server-database.service';
// import { FirebaseDatabaseService } from './services/firebase-database.service';

/** Use JSON Server (run `npm run api`) or LocalStorage. Switch to Firebase when ready. */
const USE_JSON_SERVER = true;

export const appConfig: ApplicationConfig = {
  providers: [
    provideZoneChangeDetection({ eventCoalescing: true }),
    provideRouter(routes),
    provideHttpClient(
      withInterceptors([httpErrorInterceptor])
    ),
    provideCharts(withDefaultRegisterables()),
    { provide: ErrorHandler, useClass: ErrorHandlerService },
    {
      provide: DATABASE_SERVICE,
      useClass: USE_JSON_SERVER ? JsonServerDatabaseService : LocalStorageDatabaseService,
    },
    // When Firebase is ready: useClass: FirebaseDatabaseService
  ],
};