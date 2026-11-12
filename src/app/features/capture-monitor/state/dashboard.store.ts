import { computed, inject, Injectable, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { BehaviorSubject, catchError, defer, EMPTY, exhaustMap, finalize, merge, of, Subject, switchMap, tap, timeout, timer } from 'rxjs';
import { PUBLIC_CONFIG } from '../../../core/config/public-config';
import { ApiError } from '../../../core/http/api-error.model';
import { CatalogsApiService } from '../data-access/catalogs-api.service';
import { MonitorApiService } from '../data-access/monitor-api.service';
import { monitorParams } from '../data-access/query-params';
import type { Catalogs, MonitorFilters, MonitorSnapshot } from '../models/monitor.model';

function failure(error: unknown): ApiError {
  return error instanceof ApiError ? error : new ApiError(0, 'REQUEST_FAILED', 'La consulta no se completó a tiempo. Intenta nuevamente.');
}
// Se provee en la página: navegación fuera del dashboard destruye peticiones y temporizadores.
@Injectable()
export class DashboardStore {
  private readonly api = inject(MonitorApiService);
  private readonly catalogsApi = inject(CatalogsApiService);
  readonly intervalMs = inject(PUBLIC_CONFIG).refreshIntervalMs;
  private readonly filtersSource = new BehaviorSubject<MonitorFilters>({});
  private readonly refreshSource = new Subject<void>();
  private readonly catalogRetry = new Subject<void>();
  private readonly snapshotValue = signal<MonitorSnapshot | null>(null);
  private readonly filtersValue = signal<MonitorFilters>({});
  private readonly catalogsValue = signal<Catalogs | null>(null);
  private readonly loadingValue = signal(false);
  private readonly catalogsLoadingValue = signal(false);
  private readonly errorValue = signal<ApiError | null>(null);
  private readonly catalogErrorValue = signal<ApiError | null>(null);
  readonly snapshot = this.snapshotValue.asReadonly();
  readonly filters = this.filtersValue.asReadonly();
  readonly catalogs = this.catalogsValue.asReadonly();
  readonly loading = this.loadingValue.asReadonly();
  readonly catalogsLoading = this.catalogsLoadingValue.asReadonly();
  readonly error = this.errorValue.asReadonly();
  readonly catalogError = this.catalogErrorValue.asReadonly();
  readonly stale = computed(() => this.snapshot() !== null && this.error() !== null);

  constructor() {
    merge(of(undefined), this.catalogRetry).pipe(
      exhaustMap(() => defer(() => {
        this.catalogsLoadingValue.set(true); this.catalogErrorValue.set(null);
        return this.catalogsApi.getCatalogs().pipe(timeout(20000), tap(response => this.catalogsValue.set(response.data)),
          catchError((error: unknown) => { this.catalogErrorValue.set(failure(error)); return EMPTY; }),
          finalize(() => this.catalogsLoadingValue.set(false)));
      })), takeUntilDestroyed(),
    ).subscribe();
    this.filtersSource.pipe(
      // Un cambio de filtros cancela el corte anterior. Cada grupo admite una sola consulta simultánea.
      switchMap(filters => merge(of(0), this.refreshSource, timer(this.intervalMs, this.intervalMs)).pipe(
        exhaustMap(() => defer(() => {
          this.loadingValue.set(true);
          return this.api.getMonitor(filters).pipe(timeout(20000), tap(response => {
            this.snapshotValue.set(response.data); this.errorValue.set(null);
          }), catchError((error: unknown) => { this.errorValue.set(failure(error)); return EMPTY; }),
          finalize(() => this.loadingValue.set(false)));
        })),
      )), takeUntilDestroyed(),
    ).subscribe();
  }
  applyFilters(filters: MonitorFilters): void {
    try {
      monitorParams(filters);
      const catalogs = this.catalogs();
      if ((filters.distritoId !== undefined && !catalogs?.distritos.some(d => d.id === filters.distritoId)) ||
          (filters.tipoEleccionId !== undefined && !catalogs?.elecciones.some(e => e.id === filters.tipoEleccionId))) {
        throw new ApiError(400, 'VALIDATION_ERROR', 'Selecciona un distrito y una elección del catálogo.');
      }
    } catch (error) { this.errorValue.set(failure(error)); return; }
    const previous = this.filters();
    if (previous.distritoId === filters.distritoId && previous.tipoEleccionId === filters.tipoEleccionId) return;
    const next = { ...filters };
    this.filtersValue.set(next); this.snapshotValue.set(null); this.errorValue.set(null);
    this.filtersSource.next(next);
  }
  refresh(): void { this.refreshSource.next(); }
  reloadCatalogs(): void { this.catalogRetry.next(); }
}
