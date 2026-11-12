import { TestBed } from '@angular/core/testing';
import { provideHttpClient, withInterceptors } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { ReportActions } from './report-actions';
import { PUBLIC_CONFIG } from '../../../../core/config/public-config';
import { apiErrorInterceptor } from '../../../../core/http/api-error.interceptor';
import { FileDownloadService } from '../../../../shared/utils/file-download.service';
import type { MonitorSnapshot } from '../../models/monitor.model';
const cut = '00000000-0000-4000-8000-000000000001';
const nextCut = '00000000-0000-4000-8000-000000000002';
const snapshot: MonitorSnapshot = { corteId: cut, generadoEn: '2026-10-01T18:00:00Z', filtros: { distritoId: 1, distrito: 'Distrito 01', tipoEleccion: 'Todas' }, resumen: { esperadas: 120, capturadas: 96, pendientes: 24, porcentaje: 80, semaforo: 'verde' }, distritos: [], elecciones: [], detalle: [] };
function errorBlob(code: string): Blob {
  const json = JSON.stringify({ success: false, error: { code, message: 'Error de reporte.' }, meta: { requestId: 'request-download' } });
  const blob = new Blob([json], { type: 'application/json' });
  if (!blob.text) Object.defineProperty(blob, 'text', { value: async () => json });
  return blob;
}
describe('Controles de reportes con HttpClient', () => {
  const save = vi.fn();
  let http: HttpTestingController;
  beforeEach(() => {
    vi.useFakeTimers(); save.mockReset();
    TestBed.configureTestingModule({ imports: [ReportActions], providers: [provideHttpClient(withInterceptors([apiErrorInterceptor])), provideHttpClientTesting(), { provide: PUBLIC_CONFIG, useValue: { apiBaseUrl: '/api', refreshIntervalMs: 30000 } }, { provide: FileDownloadService, useValue: { save } }] });
    http = TestBed.inject(HttpTestingController);
  });
  afterEach(() => { http.verify({ ignoreCancelled: true }); TestBed.resetTestingModule(); vi.useRealTimers(); });
  function component() { const fixture = TestBed.createComponent(ReportActions); fixture.componentRef.setInput('snapshot', snapshot); fixture.detectChanges(); return fixture; }
  it.each(['pdf', 'xlsx'] as const)('descarga %s por el corte exacto, sin combinar filtros', format => {
    const fixture = component(); const comp = fixture.componentInstance;
    const mime = format === 'pdf' ? 'application/pdf' : 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet';
    comp.download(format); fixture.detectChanges();
    expect(comp.busy()).toBe(format); expect((fixture.nativeElement as HTMLElement).querySelectorAll('button:disabled')).toHaveLength(2);
    comp.download(format); const req = http.expectOne(`/api/reportes/${format}?corteId=${cut}`);
    expect(req.request.params.has('distritoId')).toBe(false);
    req.flush(new Blob(['server-report'], { type: mime }), { headers: { 'Content-Type': mime, 'Content-Disposition': `attachment; filename="actas.${format}"` } });
    expect(save).toHaveBeenCalledWith(expect.any(Blob), `actas.${format}`); expect(comp.busy()).toBeNull(); expect(comp.success()?.generadoEn).toBe(snapshot.generadoEn);
    fixture.detectChanges(); expect((fixture.nativeElement as HTMLElement).textContent).toContain('Descarga iniciada'); fixture.destroy();
  });
  it('mantiene el corte solicitado si el polling renueva el panel durante la descarga', () => {
    const fixture = component(); fixture.componentInstance.download('pdf');
    const req = http.expectOne(`/api/reportes/pdf?corteId=${cut}`);
    fixture.componentRef.setInput('snapshot', { ...snapshot, corteId: nextCut, generadoEn: '2026-10-01T18:00:30Z' }); fixture.detectChanges();
    req.flush(new Blob(['server-report'], { type: 'application/pdf' }));
    expect(fixture.componentInstance.success()?.generadoEn).toBe(snapshot.generadoEn); fixture.destroy();
  });
  it('exige actualizar tras un 410 y no exporta automáticamente el corte nuevo', async () => {
    const fixture = component(); const comp = fixture.componentInstance;
    comp.download('pdf'); http.expectOne(`/api/reportes/pdf?corteId=${cut}`).flush(errorBlob('SNAPSHOT_EXPIRED'), { status: 410, statusText: 'Gone' });
    await vi.advanceTimersByTimeAsync(0); fixture.detectChanges();
    expect(comp.expired()).toBe(true); expect(comp.blocked()).toBe(true); expect(comp.error()?.requestId).toBe('request-download');
    const refresh = vi.fn(); comp.refresh.subscribe(refresh);
    const button = [...(fixture.nativeElement as HTMLElement).querySelectorAll('button')].find(b => b.textContent?.includes('Actualizar panel'))!;
    button.click(); expect(refresh).toHaveBeenCalledOnce();
    fixture.componentRef.setInput('snapshot', { ...snapshot, corteId: nextCut }); fixture.detectChanges();
    expect(comp.blocked()).toBe(false); http.expectNone(r => r.url.includes('/reportes/')); fixture.destroy();
  });
  it('respeta un minuto de espera tras 429 sin reintentos automáticos', async () => {
    const fixture = component(); const comp = fixture.componentInstance; comp.download('xlsx');
    http.expectOne(`/api/reportes/xlsx?corteId=${cut}`).flush(errorBlob('RATE_LIMIT'), { status: 429, statusText: 'Too Many Requests' });
    await vi.advanceTimersByTimeAsync(0); expect(comp.cooldown()).toBe(true); comp.retry(); http.expectNone(r => r.url.includes('/reportes/'));
    await vi.advanceTimersByTimeAsync(60000); expect(comp.cooldown()).toBe(false); http.expectNone(r => r.url.includes('/reportes/')); fixture.destroy();
  });
  it('maneja error de red y permite reintentar el formato solicitado', async () => {
    const fixture = component(); const comp = fixture.componentInstance; comp.download('pdf');
    http.expectOne(`/api/reportes/pdf?corteId=${cut}`).error(new ProgressEvent('error')); await vi.advanceTimersByTimeAsync(0);
    expect(comp.error()?.code).toBe('NETWORK_ERROR'); comp.retry();
    http.expectOne(`/api/reportes/pdf?corteId=${cut}`).flush(new Blob(['file'], { type: 'application/pdf' })); expect(save).toHaveBeenCalledOnce(); fixture.destroy();
  });
  it('no descarga HTML o un archivo vacío como reporte', () => {
    const fixture = component(); const comp = fixture.componentInstance; comp.download('pdf');
    http.expectOne(`/api/reportes/pdf?corteId=${cut}`).flush(new Blob(['<html>error</html>'], { type: 'text/html' }));
    expect(save).not.toHaveBeenCalled(); expect(comp.error()?.code).toBe('INVALID_REPORT'); fixture.destroy();
  });
  it('cancela al destruir el componente y no descarga respuestas antiguas', () => {
    const fixture = component(); fixture.componentInstance.download('pdf'); const req = http.expectOne(`/api/reportes/pdf?corteId=${cut}`);
    fixture.destroy(); expect(req.cancelled).toBe(true); expect(save).not.toHaveBeenCalled();
  });
  it('cancela solicitudes que exceden el timeout', async () => {
    const fixture = component(); const comp = fixture.componentInstance; comp.download('pdf'); const req = http.expectOne(`/api/reportes/pdf?corteId=${cut}`);
    await vi.advanceTimersByTimeAsync(60000); expect(req.cancelled).toBe(true); expect(comp.error()?.code).toBe('DOWNLOAD_FAILED'); expect(comp.busy()).toBeNull(); fixture.destroy();
  });
  it('no solicita archivos mientras el panel está actualizándose', () => {
    const fixture = component(); fixture.componentRef.setInput('disabled', true); fixture.detectChanges(); fixture.componentInstance.download('pdf');
    http.expectNone(r => r.url.includes('/reportes/')); fixture.destroy();
  });
});
