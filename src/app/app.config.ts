import { ApplicationConfig, provideZoneChangeDetection } from '@angular/core';
import { provideRouter } from '@angular/router';
import { provideHttpClient } from '@angular/common/http';
import { provideCharts, withDefaultRegisterables } from 'ng2-charts';
import { routes } from './app.routes';
// To switch to Firebase, uncomment the following imports:
// import { IDatabaseService } from './services/database.interface';
// import { FirebaseDatabaseService } from './services/firebase-database.service';

export const appConfig: ApplicationConfig = {
  providers: [
    provideZoneChangeDetection({ eventCoalescing: true }),
    provideRouter(routes),
    provideHttpClient(),
    provideCharts(withDefaultRegisterables()),
    // To switch to Firebase, uncomment the following provider:
    // { provide: IDatabaseService, useClass: FirebaseDatabaseService },
    // Then update DataService constructor to inject IDatabaseService instead of LocalStorageDatabaseService
  ],
};
