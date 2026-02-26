import { bootstrapApplication } from '@angular/platform-browser';
import { appConfig } from './app/app.config';
import { AppComponent } from './app/app.component';

// Handle unhandled promise rejections
// Note: ErrorHandlerService will be available after bootstrap via app.config.ts
window.addEventListener('unhandledrejection', (event) => {
  console.error('Unhandled promise rejection:', event.reason);
  // The global ErrorHandler will handle this after Angular is bootstrapped
  // For now, just log it
  event.preventDefault(); // Prevent default browser error handling
});

bootstrapApplication(AppComponent, appConfig).catch((err) => {
  console.error('Bootstrap error:', err);
  // The global ErrorHandler will handle errors after Angular is bootstrapped
});
