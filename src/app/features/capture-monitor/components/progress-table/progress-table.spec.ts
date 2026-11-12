import { TestBed } from '@angular/core/testing';
import { ProgressTable, searchRows } from './progress-table';
import type { DetailRow } from '../../models/monitor.model';
const rows: DetailRow[] = Array.from({ length: 15 }, (_, index) => ({ distritoId: Math.floor(index / 3) + 1, distrito: `Distrito ${Math.floor(index / 3) + 1}`, tipoEleccionId: index % 3 + 1, tipoEleccion: index % 3 === 2 ? 'Alcaldías' : `Diputaciones ${index % 3 === 0 ? 'MR' : 'RP'}`, esperadas: 120, capturadas: 90, pendientes: 30, porcentaje: 75, semaforo: 'amarillo' }));
describe('Tabla de avance', () => {
  it('busca sin distinguir acentos ni mayúsculas sobre el conjunto completo', () => {
    expect(searchRows(rows, '  ALCALDIAS ')).toHaveLength(5); expect(searchRows(rows, 'Distrito 5')).toHaveLength(3); expect(searchRows(rows, '')).toHaveLength(15);
  });
  it('pagina y conserva los totales del panel ante búsqueda local', () => {
    const fixture = TestBed.createComponent(ProgressTable);
    fixture.componentRef.setInput('rows', rows); fixture.componentRef.setInput('totals', { esperadas: 1800, capturadas: 1350, pendientes: 450, porcentaje: 75, semaforo: 'amarillo' }); fixture.detectChanges();
    const table = fixture.componentInstance; expect(table.visible()).toHaveLength(10); table.changePage(2); expect(table.visible()).toHaveLength(5);
    fixture.componentRef.setInput('rows', [...rows]); fixture.detectChanges(); expect(table.page()).toBe(2);
    table.query.set('alcaldias'); fixture.detectChanges(); expect(table.page()).toBe(1); expect(table.visible()).toHaveLength(5);
    expect((fixture.nativeElement as HTMLElement).querySelector('tfoot')?.textContent).toContain('1,800');
    table.query.set('inexistente'); fixture.detectChanges(); expect(table.visible()).toHaveLength(0); expect(table.totalPages()).toBe(0);
    expect((fixture.nativeElement as HTMLElement).textContent).toContain('No hay coincidencias');
  });
});
