import { TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { ActasStore } from './actas.store';
import { PUBLIC_CONFIG } from '../../../core/config/public-config';
const catalogs = { distritos: [{ id: 1, nombre: 'Distrito 01' }, { id: 2, nombre: 'Distrito 02' }], elecciones: [{ id: 1, nombre: 'Diputaciones MR' }] };
const response = (data: unknown) => ({ success: true, data, meta: { requestId: 'test' } });
const page = (pagina = 1, total = 60, limite = 25) => ({ items: [], total, pagina, limite, totalPaginas: Math.ceil(total / limite) });
describe('ActasStore: paginación HTTP', () => {
  let http: HttpTestingController; let store: ActasStore;
  beforeEach(() => {
    vi.useFakeTimers();
    TestBed.configureTestingModule({ providers: [ActasStore, provideHttpClient(), provideHttpClientTesting(), { provide: PUBLIC_CONFIG, useValue: { apiBaseUrl: '/api', refreshIntervalMs: 30000 } }] });
    http = TestBed.inject(HttpTestingController); store = TestBed.inject(ActasStore);
  });
  afterEach(() => { http.verify({ ignoreCancelled: true }); TestBed.resetTestingModule(); vi.useRealTimers(); });
  function load(): void { http.expectOne('/api/catalogos').flush(response(catalogs)); http.expectOne('/api/actas?pagina=1&limite=25').flush(response(page())); }
  it('consulta la primera página y conserva el total informado por el servidor', () => {
    expect(store.loading()).toBe(true); load(); expect(store.result()?.total).toBe(60); expect(store.result()?.totalPaginas).toBe(3); expect(store.loading()).toBe(false);
  });
  it('conserva distrito, elección y estado al paginar', () => {
    load(); store.setFilters({ distritoId: 1, tipoEleccionId: 1 });
    http.expectOne('/api/actas?distritoId=1&tipoEleccionId=1&pagina=1&limite=25').flush(response(page()));
    store.setStatus('Pendiente'); http.expectOne('/api/actas?distritoId=1&tipoEleccionId=1&pagina=1&limite=25&estado=Pendiente').flush(response(page()));
    store.setPage(2); http.expectOne('/api/actas?distritoId=1&tipoEleccionId=1&pagina=2&limite=25&estado=Pendiente').flush(response(page(2)));
    expect(store.query().pagina).toBe(2);
  });
  it('restablece página al cambiar estado, filtros o límite', () => {
    load(); store.setPage(2); http.expectOne('/api/actas?pagina=2&limite=25').flush(response(page(2)));
    store.setStatus('Capturada'); http.expectOne('/api/actas?pagina=1&limite=25&estado=Capturada').flush(response(page()));
    store.setLimit(10); http.expectOne('/api/actas?pagina=1&limite=10&estado=Capturada').flush(response(page(1,60,10)));
    store.setFilters({ distritoId: 2 }); http.expectOne('/api/actas?distritoId=2&pagina=1&limite=10&estado=Capturada').flush(response(page(1,60,10)));
    store.reset(); http.expectOne('/api/actas?pagina=1&limite=10').flush(response(page(1,60,10)));
  });
  it('Todos omite estado y no duplica consultas idénticas', () => {
    load(); store.setStatus(''); http.expectNone(r => r.url === '/api/actas');
    store.setStatus('Pendiente'); http.expectOne('/api/actas?pagina=1&limite=25&estado=Pendiente').flush(response(page()));
    store.setStatus(''); http.expectOne('/api/actas?pagina=1&limite=25').flush(response(page()));
  });
  it('cancela la petición anterior ante un cambio rápido de filtros', () => {
    load(); store.setFilters({ distritoId: 1 }); const pending = http.expectOne('/api/actas?distritoId=1&pagina=1&limite=25');
    store.setFilters({ distritoId: 2 }); expect(pending.cancelled).toBe(true); expect(store.result()).toBeNull();
    http.expectOne('/api/actas?distritoId=2&pagina=1&limite=25').flush(response(page()));
  });
  it('rechaza filtros y límites inválidos sin enviar SQL', () => {
    load(); store.setFilters({ distritoId: 99 }); expect(store.error()?.code).toBe('VALIDATION_ERROR');
    store.setStatus('invalido'); store.setLimit(101); store.setPage(99); http.expectNone(r => r.url === '/api/actas');
  });
  it('recupera una página desaparecida incluso si el conjunto queda vacío', () => {
    load(); store.setPage(3); http.expectOne('/api/actas?pagina=3&limite=25').flush(response(page(3,0)));
    expect(store.outOfRange()).toBe(true); store.setPage(1); http.expectOne('/api/actas?pagina=1&limite=25').flush(response(page(1,0)));
    expect(store.outOfRange()).toBe(false); expect(store.range()).toEqual({ start: 0, end: 0 });
  });
  it('no permite solicitudes de actualización simultáneas y conserva datos al fallar', () => {
    load(); store.refresh(); const pending = http.expectOne('/api/actas?pagina=1&limite=25');
    store.refresh(); http.expectNone(r => r.url === '/api/actas');
    pending.flush({}, { status: 503, statusText: 'Unavailable' }); expect(store.stale()).toBe(true);
    store.refresh(); http.expectOne('/api/actas?pagina=1&limite=25').flush(response(page())); expect(store.error()).toBeNull();
  });
  it('muestra error inicial sin presentarlo como cero resultados y permite reintento', () => {
    http.expectOne('/api/catalogos').flush(response(catalogs)); http.expectOne('/api/actas?pagina=1&limite=25').flush({}, { status: 503, statusText: 'Unavailable' });
    expect(store.result()).toBeNull(); expect(store.error()).not.toBeNull(); store.refresh(); http.expectOne('/api/actas?pagina=1&limite=25').flush(response(page()));
  });
  it('recupera catálogos y cancela consultas lentas', () => {
    http.expectOne('/api/catalogos').flush({}, { status: 503, statusText: 'Unavailable' }); const pending = http.expectOne('/api/actas?pagina=1&limite=25');
    store.reloadCatalogs(); http.expectOne('/api/catalogos').flush(response(catalogs)); expect(store.catalogError()).toBeNull();
    vi.advanceTimersByTime(20000); expect(pending.cancelled).toBe(true); expect(store.loading()).toBe(false);
  });
  it('cancela solicitudes al salir de la página', () => {
    const catalog = http.expectOne('/api/catalogos'); const actas = http.expectOne('/api/actas?pagina=1&limite=25');
    TestBed.resetTestingModule(); expect(catalog.cancelled).toBe(true); expect(actas.cancelled).toBe(true);
  });
});
