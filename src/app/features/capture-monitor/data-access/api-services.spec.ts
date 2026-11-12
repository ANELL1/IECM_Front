import { TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { PUBLIC_CONFIG } from '../../../core/config/public-config';
import { MonitorApiService } from './monitor-api.service';
import { ActasApiService } from './actas-api.service';
import { CatalogsApiService } from './catalogs-api.service';
import { ReportsApiService } from './reports-api.service';
describe('Servicios y contratos HTTP', () => {
  let http: HttpTestingController;
  beforeEach(() => {
    TestBed.configureTestingModule({ providers: [provideHttpClient(), provideHttpClientTesting(), { provide: PUBLIC_CONFIG, useValue: { apiBaseUrl: '/api', refreshIntervalMs: 30000 } }] });
    http = TestBed.inject(HttpTestingController);
  });
  afterEach(() => http.verify());
  it('consulta monitor con filtros y conserva el sobre', () => {
    const response = { success: true, data: { corteId: 'test' }, meta: { requestId: 'req' } };
    TestBed.inject(MonitorApiService).getMonitor({ distritoId: 1 }).subscribe(value => expect(value).toEqual(response));
    const req = http.expectOne('/api/monitor?distritoId=1'); expect(req.request.method).toBe('GET'); req.flush(response);
  });
  it('consulta catálogos reales', () => {
    TestBed.inject(CatalogsApiService).getCatalogs().subscribe();
    http.expectOne('/api/catalogos').flush({ success: true, data: { distritos: [], elecciones: [] }, meta: { requestId: 'req' } });
  });
  it('envía filtros, estado y paginación de actas', () => {
    TestBed.inject(ActasApiService).getActas({ tipoEleccionId: 2, estado: 'Pendiente', pagina: 3, limite: 10 }).subscribe();
    const req = http.expectOne(r => r.url === '/api/actas');
    expect(req.request.params.get('tipoEleccionId')).toBe('2'); expect(req.request.params.get('estado')).toBe('Pendiente');
    expect(req.request.params.get('pagina')).toBe('3'); expect(req.request.params.get('limite')).toBe('10');
    req.flush({ success: true, data: { items: [], total: 0, pagina: 3, limite: 10, totalPaginas: 0 }, meta: { requestId: 'req' } });
  });
  it.each(['xlsx', 'pdf'] as const)('solicita archivo %s como Blob y conserva encabezados', format => {
    const corteId = '00000000-0000-4000-8000-000000000001';
    TestBed.inject(ReportsApiService).getReport(format, { corteId }).subscribe(response => expect(response.headers.get('Content-Disposition')).toContain(format));
    const req = http.expectOne(`/api/reportes/${format}?corteId=${corteId}`);
    expect(req.request.responseType).toBe('blob');
    req.flush(new Blob(['test']), { headers: { 'Content-Disposition': `attachment; filename=avance.${format}` } });
  });
  it('no envía una consulta localmente inválida', () => {
    TestBed.inject(ActasApiService).getActas({ limite: 101 }).subscribe({ error: (error: unknown) => expect(error).toMatchObject({ code: 'VALIDATION_ERROR' }) });
    http.expectNone(r => r.url === '/api/actas');
  });
});
