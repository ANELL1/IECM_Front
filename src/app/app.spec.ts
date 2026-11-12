import { ActasApiService } from './features/capture-monitor/data-access/actas-api.service';
import { EMPTY } from 'rxjs';
import { PUBLIC_CONFIG } from './core/config/public-config';
import { MonitorApiService } from './features/capture-monitor/data-access/monitor-api.service';
import { CatalogsApiService } from './features/capture-monitor/data-access/catalogs-api.service';
import { TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { RouterTestingHarness } from '@angular/router/testing';
import { routes } from './app.routes';
import { App } from './app';
describe('Rutas standalone', () => {
  beforeEach(() => TestBed.configureTestingModule({ providers: [provideRouter(routes), { provide: ActasApiService, useValue: { getActas: () => EMPTY } }, { provide: PUBLIC_CONFIG, useValue: { apiBaseUrl: '/api', refreshIntervalMs: 30000 } }, { provide: MonitorApiService, useValue: { getMonitor: () => EMPTY } }, { provide: CatalogsApiService, useValue: { getCatalogs: () => EMPTY } }] }));
  it('crea la raíz', () => expect(TestBed.createComponent(App).componentInstance).toBeTruthy());
  it('redirige al dashboard y carga actas de forma diferida', async () => {
    const harness = await RouterTestingHarness.create();
    await harness.navigateByUrl('/');
    expect(harness.routeNativeElement?.textContent).toContain('Monitor de avance');
    await harness.navigateByUrl('/actas');
    expect(harness.routeNativeElement?.textContent).toContain('Consulta de actas');
  });
  it('muestra una página para rutas inexistentes', async () => {
    const harness = await RouterTestingHarness.create(); await harness.navigateByUrl('/no-existe');
    expect(harness.routeNativeElement?.textContent).toContain('Página no encontrada');
  });
});
