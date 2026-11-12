import { TestBed } from '@angular/core/testing';
import { ErrorState } from './error-state/error-state';
import { LoadingState } from './loading-state/loading-state';
import { EmptyState } from './empty-state/empty-state';
import { StatusBadge } from './status-badge/status-badge';
describe('Estados compartidos', () => {
  it('anuncia carga y resultados vacíos', () => {
    const loading = TestBed.createComponent(LoadingState); loading.detectChanges();
    expect((loading.nativeElement as HTMLElement).querySelector('[role="status"]')?.textContent).toContain('Consultando');
    const empty = TestBed.createComponent(EmptyState); empty.detectChanges();
    expect((empty.nativeElement as HTMLElement).querySelector('[role="status"]')?.textContent).toContain('Sin datos');
  });
  it('emite reintento y muestra referencia sin interpretar HTML', () => {
    const fixture = TestBed.createComponent(ErrorState);
    fixture.componentRef.setInput('message', '<script>mensaje</script>');
    fixture.componentRef.setInput('requestId', 'req-123');
    const retry = vi.fn(); fixture.componentInstance.retry.subscribe(retry); fixture.detectChanges();
    const root = fixture.nativeElement as HTMLElement;
    root.querySelector<HTMLButtonElement>('button')!.click();
    expect(retry).toHaveBeenCalledOnce();
    expect(root.querySelector('script')).toBeNull();
    expect(root.textContent).toContain('req-123');
    fixture.componentRef.setInput('retryable', false); fixture.detectChanges();
    expect(root.querySelector('button')).toBeNull();
  });
  it.each([['rojo','Avance bajo'],['amarillo','Avance medio'],['verde','Avance alto'],['sin_datos','Sin datos']])('describe %s sin depender del color', (status, label) => {
    const fixture = TestBed.createComponent(StatusBadge); fixture.componentRef.setInput('status', status); fixture.detectChanges();
    expect((fixture.nativeElement as HTMLElement).textContent).toContain(label);
  });
});
