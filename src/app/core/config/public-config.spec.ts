import { TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { parsePublicConfig, PublicConfigService } from './public-config';
describe('Configuración pública', () => {
  it('normaliza URL y conserva intervalo', () => expect(parsePublicConfig({ apiBaseUrl: '/api/', refreshIntervalMs: 30000 })).toEqual({ apiBaseUrl: '/api', refreshIntervalMs: 30000 }));
  it.each(['//evil.example/api', 'javascript:alert(1)', 'https://user:secret@example.com/api', '/api?token=secret', '/'])('rechaza URL insegura %s', apiBaseUrl => expect(() => parsePublicConfig({ apiBaseUrl, refreshIntervalMs: 30000 })).toThrow());
  it('rechaza secretos y campos adicionales', () => expect(() => parsePublicConfig({ apiBaseUrl: '/api', refreshIntervalMs: 30000, DB_PASSWORD: 'secret' })).toThrow());
  it('rechaza intervalos inválidos', () => expect(() => parsePublicConfig({ apiBaseUrl: '/api', refreshIntervalMs: 0 })).toThrow());
  it('carga configuración real mediante HTTP antes de exponerla', async () => {
    TestBed.configureTestingModule({ providers: [provideHttpClient(), provideHttpClientTesting()] });
    const service = TestBed.inject(PublicConfigService);
    const http = TestBed.inject(HttpTestingController);
    expect(() => service.value).toThrow();
    const loaded = service.load();
    http.expectOne('app-config.json').flush({ apiBaseUrl: '/api', refreshIntervalMs: 30000 });
    await loaded;
    expect(service.value.apiBaseUrl).toBe('/api'); http.verify();
  });
});
