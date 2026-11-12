import { TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { DashboardPage } from './dashboard.page';
import { PUBLIC_CONFIG } from '../../../../core/config/public-config';
describe('Dashboard renderizado', () => {
  beforeEach(() => TestBed.configureTestingModule({ imports: [DashboardPage], providers: [provideHttpClient(), provideHttpClientTesting(), { provide: PUBLIC_CONFIG, useValue: { apiBaseUrl: '/api', refreshIntervalMs: 30000 } }] }));
  afterEach(() => TestBed.inject(HttpTestingController).verify({ ignoreCancelled: true }));
  it('muestra cuatro indicadores, tres gráficas y tabla del mismo corte', () => {
    const fixture = TestBed.createComponent(DashboardPage); fixture.detectChanges(); const http = TestBed.inject(HttpTestingController);
    http.expectOne('/api/catalogos').flush({ success: true, data: { distritos: [{ id: 1, nombre: 'Distrito 01' }], elecciones: [{ id: 1, nombre: 'Diputaciones MR' }] }, meta: { requestId: 'test' } });
    const metrics = { esperadas: 120, capturadas: 96, pendientes: 24, porcentaje: 80, semaforo: 'verde' };
    http.expectOne('/api/monitor').flush({ success: true, data: { generadoEn: '2026-10-01T18:00:00Z', corteId: 'test', filtros: { distrito: 'Todos', tipoEleccion: 'Todas' }, resumen: metrics, distritos: [{ id: 1, nombre: 'Distrito 01', ...metrics }], elecciones: [{ id: 1, nombre: 'Diputaciones MR', ...metrics }], detalle: [{ distritoId: 1, distrito: 'Distrito 01', tipoEleccionId: 1, tipoEleccion: 'Diputaciones MR', ...metrics }] }, meta: { requestId: 'test' } });
    fixture.detectChanges(); const root = fixture.nativeElement as HTMLElement;
    expect(root.querySelectorAll('app-metric-card')).toHaveLength(4); expect(root.querySelectorAll('figure')).toHaveLength(3);
    expect(root.querySelector('app-metric-card.progress')).toBeNull();
    expect(root.querySelector('app-capture-donut')?.textContent).toContain('80.00%');
    expect(root.querySelector('tbody')?.textContent).toContain('96'); expect(root.querySelector('tfoot')?.textContent).toContain('80.00%');
    expect(root.textContent).toContain('cada 30 s'); fixture.destroy();
  });
});
