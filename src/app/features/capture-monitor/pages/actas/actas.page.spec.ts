import { TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { PUBLIC_CONFIG } from '../../../../core/config/public-config';
import { ActasPage } from './actas.page';
const response = (data: unknown) => ({ success: true, data, meta: { requestId: 'test' } });
describe('Pantalla de actas', () => {
  beforeEach(() => TestBed.configureTestingModule({ imports: [ActasPage], providers: [provideHttpClient(), provideHttpClientTesting(), { provide: PUBLIC_CONFIG, useValue: { apiBaseUrl: '/api', refreshIntervalMs: 30000 } }] }));
  afterEach(() => TestBed.inject(HttpTestingController).verify({ ignoreCancelled: true }));
  it('renderiza fechas, estado y total del servidor y solicita la siguiente página', () => {
    const fixture = TestBed.createComponent(ActasPage); fixture.detectChanges(); const http = TestBed.inject(HttpTestingController);
    http.expectOne('/api/catalogos').flush(response({ distritos: [], elecciones: [] }));
    const common = { distritoId: 1, distrito: 'Distrito 01', tipoEleccionId: 1, tipoEleccion: 'Diputaciones MR' };
    http.expectOne('/api/actas?pagina=1&limite=25').flush(response({ items: [ { ...common, actaId: 1, numeroActa: 1, estado: 'Capturada', fechaCaptura: '2026-10-01T18:00:00.000Z' }, { ...common, actaId: 2, numeroActa: 2, estado: 'Pendiente', fechaCaptura: null } ], pagina: 1, limite: 25, total: 30, totalPaginas: 2 }));
    fixture.detectChanges(); const root = fixture.nativeElement as HTMLElement;
    expect(root.querySelectorAll('tbody tr')).toHaveLength(2); expect(root.querySelector('time')?.getAttribute('datetime')).toBe('2026-10-01T18:00:00.000Z');
    expect(root.textContent).toContain('Sin captura'); expect(root.textContent).toContain('30 actas encontradas');
    root.querySelector<HTMLButtonElement>('button[aria-label="Página siguiente"]')!.click(); fixture.detectChanges();
    expect(root.querySelector('app-actas-table')).toBeNull();
    http.expectOne('/api/actas?pagina=2&limite=25').flush(response({ items: [], pagina: 2, limite: 25, total: 30, totalPaginas: 2 })); fixture.destroy();
  });
  it('distingue un conjunto vacío exitoso de una falla de API', () => {
    const fixture = TestBed.createComponent(ActasPage); fixture.detectChanges(); const http = TestBed.inject(HttpTestingController);
    http.expectOne('/api/catalogos').flush(response({ distritos: [], elecciones: [] })); http.expectOne('/api/actas?pagina=1&limite=25').flush(response({ items: [], total: 0, pagina: 1, limite: 25, totalPaginas: 0 })); fixture.detectChanges();
    const root = fixture.nativeElement as HTMLElement; expect(root.querySelector('app-empty-state')).toBeTruthy(); expect(root.querySelector('app-error-state')).toBeNull();
    expect(root.querySelector<HTMLButtonElement>('button[aria-label="Página siguiente"]')!.disabled).toBe(true); fixture.destroy();
  });
});
