import { TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { DashboardStore } from './dashboard.store';
import { PUBLIC_CONFIG } from '../../../core/config/public-config';
import type { MonitorSnapshot } from '../models/monitor.model';
const catalogs = { distritos: [{ id: 1, nombre: 'Distrito 01' }, { id: 2, nombre: 'Distrito 02' }], elecciones: [{ id: 1, nombre: 'Diputaciones MR' }] };
const snapshot: MonitorSnapshot = { generadoEn: '2026-10-01T18:00:00Z', corteId: 'test-cut', filtros: { distrito: 'Todos', tipoEleccion: 'Todas' }, resumen: { esperadas: 120, capturadas: 96, pendientes: 24, porcentaje: 80, semaforo: 'verde' }, distritos: [], elecciones: [], detalle: [] };
const response = (data: unknown) => ({ success: true, data, meta: { requestId: 'test-request' } });
describe('DashboardStore con HttpClient', () => {
  let http: HttpTestingController;
  let store: DashboardStore;
  beforeEach(() => {
    vi.useFakeTimers();
    TestBed.configureTestingModule({ providers: [DashboardStore, provideHttpClient(), provideHttpClientTesting(), { provide: PUBLIC_CONFIG, useValue: { apiBaseUrl: '/api', refreshIntervalMs: 30000 } }] });
    http = TestBed.inject(HttpTestingController); store = TestBed.inject(DashboardStore);
  });
  afterEach(() => { http.verify({ ignoreCancelled: true }); TestBed.resetTestingModule(); vi.useRealTimers(); });
  function load(): void { http.expectOne('/api/catalogos').flush(response(catalogs)); http.expectOne('/api/monitor').flush(response(snapshot)); }
  it('consulta datos reales por HTTP y conserva los totales del backend', () => {
    expect(store.loading()).toBe(true); expect(store.snapshot()).toBeNull(); load();
    expect(store.snapshot()?.resumen).toEqual(snapshot.resumen); expect(store.loading()).toBe(false);
  });
  it('actualiza cada 30 segundos, conserva filtros y evita solicitudes simultáneas', () => {
    load(); store.applyFilters({ distritoId: 1 });
    http.expectOne('/api/monitor?distritoId=1').flush(response(snapshot));
    vi.advanceTimersByTime(29999); http.expectNone(r => r.url === '/api/monitor');
    vi.advanceTimersByTime(1); const pending = http.expectOne('/api/monitor?distritoId=1');
    store.refresh(); store.refresh(); http.expectNone(r => r.url === '/api/monitor');
    pending.flush(response(snapshot));
  });
  it('cancela consultas de filtros anteriores y limpia el corte visible', () => {
    load(); store.applyFilters({ distritoId: 1 });
    const first = http.expectOne('/api/monitor?distritoId=1');
    expect(store.snapshot()).toBeNull(); store.applyFilters({ distritoId: 2 });
    expect(first.cancelled).toBe(true);
    http.expectOne('/api/monitor?distritoId=2').flush(response({ ...snapshot, corteId: 'new' }));
    expect(store.snapshot()?.corteId).toBe('new');
  });
  it('limpiar filtros omite parámetros y repetirlos no consulta de nuevo', () => {
    load(); store.applyFilters({ distritoId: 1 }); http.expectOne('/api/monitor?distritoId=1').flush(response(snapshot));
    store.applyFilters({ distritoId: 1 }); http.expectNone(r => r.url === '/api/monitor');
    store.applyFilters({}); http.expectOne('/api/monitor').flush(response(snapshot));
  });
  it('conserva datos con aviso de desactualización y se recupera en el siguiente ciclo', () => {
    load(); store.refresh(); http.expectOne('/api/monitor').flush({}, { status: 503, statusText: 'Unavailable' });
    expect(store.stale()).toBe(true); expect(store.snapshot()?.corteId).toBe('test-cut');
    vi.advanceTimersByTime(30000); http.expectOne('/api/monitor').flush(response({ ...snapshot, corteId: 'recovered' }));
    expect(store.error()).toBeNull(); expect(store.stale()).toBe(false); expect(store.snapshot()?.corteId).toBe('recovered');
  });
  it('no inventa ceros cuando falla la primera consulta', () => {
    http.expectOne('/api/catalogos').flush(response(catalogs));
    http.expectOne('/api/monitor').flush({}, { status: 503, statusText: 'Unavailable' });
    expect(store.snapshot()).toBeNull(); expect(store.error()).not.toBeNull(); expect(store.loading()).toBe(false);
  });
  it('admite un corte vacío exitoso', () => {
    http.expectOne('/api/catalogos').flush(response(catalogs));
    http.expectOne('/api/monitor').flush(response({ ...snapshot, resumen: { esperadas: 0, capturadas: 0, pendientes: 0, porcentaje: 0, semaforo: 'sin_datos' } }));
    expect(store.snapshot()?.resumen.semaforo).toBe('sin_datos'); expect(store.error()).toBeNull();
  });
  it('rechaza filtros inexistentes sin invocar la API', () => {
    load(); store.applyFilters({ distritoId: 99 });
    expect(store.error()?.code).toBe('VALIDATION_ERROR'); http.expectNone(r => r.url === '/api/monitor');
  });
  it('permite recuperar catálogos sin perder el corte', () => {
    http.expectOne('/api/catalogos').flush({}, { status: 503, statusText: 'Unavailable' });
    http.expectOne('/api/monitor').flush(response(snapshot)); expect(store.catalogError()).not.toBeNull();
    store.reloadCatalogs(); http.expectOne('/api/catalogos').flush(response(catalogs));
    expect(store.catalogError()).toBeNull(); expect(store.catalogs()?.distritos.length).toBe(2);
  });
  it('limita solicitudes lentas y permite reintentar', () => {
    http.expectOne('/api/catalogos').flush(response(catalogs)); const pending = http.expectOne('/api/monitor');
    vi.advanceTimersByTime(20000); expect(pending.cancelled).toBe(true); expect(store.loading()).toBe(false);
    store.refresh(); http.expectOne('/api/monitor').flush(response(snapshot)); expect(store.error()).toBeNull();
  });
  it('destruye peticiones y temporizadores al salir de la página', () => {
    const catalog = http.expectOne('/api/catalogos'); const monitor = http.expectOne('/api/monitor');
    TestBed.resetTestingModule(); expect(catalog.cancelled).toBe(true); expect(monitor.cancelled).toBe(true);
    vi.advanceTimersByTime(90000); http.expectNone(r => r.url.startsWith('/api/'));
  });
});
