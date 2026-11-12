import { TestBed } from '@angular/core/testing';
import { HttpClient, HttpErrorResponse, provideHttpClient, withInterceptors } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { firstValueFrom } from 'rxjs';
import { apiErrorInterceptor, normalizeHttpError } from './api-error.interceptor';
describe('Interceptor de errores', () => {
  beforeEach(() => TestBed.configureTestingModule({ providers: [provideHttpClient(withInterceptors([apiErrorInterceptor])), provideHttpClientTesting()] }));
  afterEach(() => TestBed.inject(HttpTestingController).verify());
  it.each([[400,'VALIDATION_ERROR'],[410,'SNAPSHOT_EXPIRED'],[429,'RATE_LIMIT'],[503,'DATABASE_UNAVAILABLE']])('normaliza HTTP %s', async (status, code) => {
    const promise = firstValueFrom(TestBed.inject(HttpClient).get('/api/monitor'));
    const assertion = expect(promise).rejects.toMatchObject({ status, code, requestId: 'request-1' });
    TestBed.inject(HttpTestingController).expectOne('/api/monitor').flush({ success: false, error: { code, message: 'Mensaje de servicio' }, meta: { requestId: 'request-1' } }, { status: Number(status), statusText: 'Error' });
    await assertion;
  });
  it('traduce una falla de red', async () => {
    const promise = firstValueFrom(TestBed.inject(HttpClient).get('/api/monitor'));
    const assertion = expect(promise).rejects.toMatchObject({ status: 0, code: 'NETWORK_ERROR' });
    TestBed.inject(HttpTestingController).expectOne('/api/monitor').error(new ProgressEvent('error'));
    await assertion;
  });
  it('lee errores JSON devueltos como Blob', async () => {
    const blob = new Blob([JSON.stringify({ success: false, error: { code: 'SNAPSHOT_EXPIRED', message: 'Actualiza el panel.' }, meta: { requestId: 'download-1' } })], { type: 'application/json' });
    // jsdom puede no implementar Blob.text; representar su lectura sin alterar producción.
    if (!blob.text) Object.defineProperty(blob, 'text', { value: async () => JSON.stringify({ success: false, error: { code: 'SNAPSHOT_EXPIRED', message: 'Actualiza el panel.' }, meta: { requestId: 'download-1' } }) });
    expect(await normalizeHttpError(new HttpErrorResponse({ status: 410, error: blob }))).toMatchObject({ code: 'SNAPSHOT_EXPIRED', requestId: 'download-1' });
  });
  it('no expone cuerpos inesperados del servidor', async () => {
    const result = await normalizeHttpError(new HttpErrorResponse({ status: 502, error: '<html>secret</html>' }));
    expect(result.code).toBe('HTTP_ERROR'); expect(result.message).not.toContain('secret');
  });
});
