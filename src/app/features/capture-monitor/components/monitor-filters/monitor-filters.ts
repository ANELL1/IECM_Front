import { Component, input, output } from '@angular/core';
import type { Catalogs, MonitorFilters } from '../../models/monitor.model';
@Component({ selector: 'app-monitor-filters', standalone: true, templateUrl: './monitor-filters.html', styleUrl: './monitor-filters.scss' })
export class MonitorFiltersComponent {
  readonly catalogs = input<Catalogs | null>(null);
  readonly filters = input<MonitorFilters>({});
  readonly disabled = input(false);
  readonly filtersChange = output<MonitorFilters>();
  change(key: 'distritoId' | 'tipoEleccionId', value: string): void {
    const next = { ...this.filters() };
    if (value === '') delete next[key]; else next[key] = Number(value);
    this.filtersChange.emit(next);
  }
}
