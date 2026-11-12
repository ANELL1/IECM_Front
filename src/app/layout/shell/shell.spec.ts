import { ActasApiService } from '../../features/capture-monitor/data-access/actas-api.service';
import { EMPTY } from 'rxjs';
import { PUBLIC_CONFIG } from '../../core/config/public-config';
import { MonitorApiService } from '../../features/capture-monitor/data-access/monitor-api.service';
import { CatalogsApiService } from '../../features/capture-monitor/data-access/catalogs-api.service';
import { TestBed } from '@angular/core/testing';
import { provideRouter, Router } from '@angular/router';
import { Shell } from './shell';
import { routes } from '../../app.routes';
describe('Layout institucional', () => {
  beforeEach(() => TestBed.configureTestingModule({ imports: [Shell], providers: [provideRouter(routes), { provide: ActasApiService, useValue: { getActas: () => EMPTY } }, { provide: PUBLIC_CONFIG, useValue: { apiBaseUrl: '/api', refreshIntervalMs: 30000 } }, { provide: MonitorApiService, useValue: { getMonitor: () => EMPTY } }, { provide: CatalogsApiService, useValue: { getCatalogs: () => EMPTY } }] }));
  it('permite abrir el menú y cerrarlo con Escape', async () => {
    const fixture = TestBed.createComponent(Shell); fixture.detectChanges();
    const root = fixture.nativeElement as HTMLElement;
    const menu = root.querySelector<HTMLButtonElement>('button[aria-controls]')!;
    // jsdom no aplica media queries: representar el botón visible en viewport móvil.
    menu.style.display = 'inline-flex';
    expect(menu.getAttribute('aria-expanded')).toBe('false');
    menu.click(); fixture.detectChanges();
    expect(menu.getAttribute('aria-expanded')).toBe('true');
    expect(root.querySelector('aside')?.classList.contains('mobile-open')).toBe(true);
    document.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape', bubbles: true }));
    fixture.detectChanges();
    expect(menu.getAttribute('aria-expanded')).toBe('false');
    expect(document.activeElement).toBe(menu);
    fixture.destroy();
  });
  it('actualiza título y enlace activo al navegar y cierra el menú', async () => {
    const fixture = TestBed.createComponent(Shell); fixture.detectChanges();
    const router = TestBed.inject(Router);
    await router.navigateByUrl('/dashboard'); fixture.detectChanges();
    expect(fixture.componentInstance.pageTitle()).toBe('Avance de captura');
    fixture.componentInstance.toggleNavigation();
    await router.navigateByUrl('/actas'); await fixture.whenStable(); fixture.detectChanges();
    const root = fixture.nativeElement as HTMLElement;
    expect(fixture.componentInstance.navigationOpen()).toBe(false);
    expect(fixture.componentInstance.pageTitle()).toBe('Consulta de actas');
    expect(root.querySelector('nav a[aria-current="page"]')?.textContent).toContain('Consulta de actas');
    expect(root.querySelector('main h1')?.textContent).toContain('Consulta de actas');
    expect(document.activeElement).toBe(root.querySelector('main'));
    fixture.destroy();
  });
  it('incluye salto al contenido y un único main', () => {
    const fixture = TestBed.createComponent(Shell); fixture.detectChanges();
    const root = fixture.nativeElement as HTMLElement;
    expect(root.querySelector('a[href="#main-content"]')).toBeTruthy();
    expect(root.querySelectorAll('main')).toHaveLength(1);
    expect(root.querySelector('nav')?.getAttribute('aria-label')).toBe('Navegación principal');
  });
});
