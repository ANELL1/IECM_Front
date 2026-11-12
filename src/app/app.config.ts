import { registerLocaleData } from '@angular/common';
import localeEsMx from '@angular/common/locales/es-MX';
import { ApplicationConfig, LOCALE_ID, inject, provideAppInitializer, provideBrowserGlobalErrorListeners } from '@angular/core';
import { provideHttpClient, withInterceptors } from '@angular/common/http';
import { provideRouter } from '@angular/router';
import { routes } from './app.routes';
import { PublicConfigService } from './core/config/public-config';
import { apiErrorInterceptor } from './core/http/api-error.interceptor';
registerLocaleData(localeEsMx);
export const appConfig: ApplicationConfig = {
  providers: [
    { provide: LOCALE_ID, useValue: 'es-MX' },
    provideBrowserGlobalErrorListeners(), provideRouter(routes),
    provideHttpClient(withInterceptors([apiErrorInterceptor])),
    provideAppInitializer(() => inject(PublicConfigService).load()),
  ],
};
