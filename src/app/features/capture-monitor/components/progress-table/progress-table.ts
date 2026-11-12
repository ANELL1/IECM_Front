import { DecimalPipe } from '@angular/common';
import { Component, computed, input, linkedSignal, signal } from '@angular/core';
import { StatusBadge } from '../../../../shared/ui/status-badge/status-badge';
import { Pagination } from '../../../../shared/ui/pagination/pagination';
import type { DetailRow, Metrics } from '../../models/monitor.model';
export function searchRows(rows: readonly DetailRow[], text: string): readonly DetailRow[] {
  const normalize = (value: string) => value.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLocaleLowerCase('es-MX');
  const term = normalize(text.trim());
  return rows.filter(row => normalize(`${row.distrito} ${row.tipoEleccion}`).includes(term));
}
@Component({ selector: 'app-progress-table', standalone: true, imports: [DecimalPipe, StatusBadge, Pagination], templateUrl: './progress-table.html', styleUrl: './progress-table.scss' })
export class ProgressTable {
  readonly rows = input.required<readonly DetailRow[]>(); readonly totals = input.required<Metrics>();
  readonly query = signal(''); readonly pageSize = 10;
  readonly filtered = computed(() => searchRows(this.rows(), this.query()));
  readonly totalPages = computed(() => Math.ceil(this.filtered().length / this.pageSize));
  // Al cambiar búsqueda/conjunto, volver a una página válida.
  readonly page = linkedSignal({ source: () => ({ query: this.query(), size: this.filtered().length }), computation: (current, previous): number => {
    if (!previous || current.query !== previous.source.query) return 1;
    return Math.min(previous.value, Math.max(1, Math.ceil(current.size / this.pageSize)));
  } });
  readonly visible = computed(() => this.filtered().slice((this.page() - 1) * this.pageSize, this.page() * this.pageSize));
  changePage(page: number): void { if (Number.isInteger(page) && page >= 1 && page <= this.totalPages()) this.page.set(page); }
}
