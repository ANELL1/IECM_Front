import { computed, inject, Injectable, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { BehaviorSubject, catchError, defer, EMPTY, exhaustMap, finalize, merge, of, Subject, switchMap, tap, timeout } from 'rxjs';
import { ApiError } from '../../../core/http/api-error.model';
import { ActasApiService } from '../data-access/actas-api.service';
import { CatalogsApiService } from '../data-access/catalogs-api.service';
import { actaParams } from '../data-access/query-params';
import type { ActaPage, ActaQuery, Catalogs, MonitorFilters } from '../models/monitor.model';
type Query = ActaQuery & { pagina: number; limite: number };
const failure = (error: unknown): ApiError => error instanceof ApiError ? error : new ApiError(0, 'REQUEST_FAILED', 'No fue posible completar la consulta. Intenta nuevamente.');
@Injectable()
export class ActasStore {
  private readonly api = inject(ActasApiService);
  private readonly catalogApi = inject(CatalogsApiService);
  private readonly querySource = new BehaviorSubject<Query>({ pagina: 1, limite: 25 });
  private readonly refreshSource = new Subject<void>();
  private readonly catalogRetry = new Subject<void>();
  private readonly queryValue = signal<Query>({ pagina: 1, limite: 25 });
  private readonly resultValue = signal<ActaPage | null>(null);
  private readonly loadingValue = signal(false);
  private readonly errorValue = signal<ApiError | null>(null);
  private readonly catalogsValue = signal<Catalogs | null>(null);
  private readonly catalogErrorValue = signal<ApiError | null>(null);
  private readonly catalogsLoadingValue = signal(false);
  private readonly receivedAtValue = signal<string | null>(null);
  readonly query = this.queryValue.asReadonly();
  readonly result = this.resultValue.asReadonly();
  readonly loading = this.loadingValue.asReadonly();
  readonly error = this.errorValue.asReadonly();
  readonly catalogs = this.catalogsValue.asReadonly();
  readonly catalogError = this.catalogErrorValue.asReadonly();
  readonly catalogsLoading = this.catalogsLoadingValue.asReadonly();
  readonly receivedAt = this.receivedAtValue.asReadonly();
  readonly stale = computed(() => this.result() !== null && this.error() !== null);
  readonly filters = computed<MonitorFilters>(() => {
    const query = this.query();
    return { ...(query.distritoId === undefined ? {} : { distritoId: query.distritoId }), ...(query.tipoEleccionId === undefined ? {} : { tipoEleccionId: query.tipoEleccionId }) };
  });
  readonly range = computed(() => {
    const result = this.result();
    if (!result?.items.length) return { start: 0, end: 0 };
    return { start: (result.pagina - 1) * result.limite + 1, end: (result.pagina - 1) * result.limite + result.items.length };
  });
  readonly outOfRange = computed(() => {
    const result = this.result(); return result !== null && result.items.length === 0 && result.pagina > Math.max(1, result.totalPaginas);
  });
  constructor() {
    merge(of(undefined), this.catalogRetry).pipe(exhaustMap(() => defer(() => {
      this.catalogsLoadingValue.set(true); this.catalogErrorValue.set(null);
      return this.catalogApi.getCatalogs().pipe(timeout(20000), tap(response => this.catalogsValue.set(response.data)),
        catchError((error: unknown) => { this.catalogErrorValue.set(failure(error)); return EMPTY; }), finalize(() => this.catalogsLoadingValue.set(false)));
    })), takeUntilDestroyed()).subscribe();
    this.querySource.pipe(switchMap(query => merge(of(undefined), this.refreshSource).pipe(exhaustMap(() => defer(() => {
      this.loadingValue.set(true);
      return this.api.getActas(query).pipe(timeout(20000), tap(response => {
        this.resultValue.set(response.data); this.errorValue.set(null); this.receivedAtValue.set(new Date().toISOString());
      }), catchError((error: unknown) => { this.errorValue.set(failure(error)); return EMPTY; }), finalize(() => this.loadingValue.set(false)));
    })))), takeUntilDestroyed()).subscribe();
  }
  private setQuery(next: Query): void {
    try {
      actaParams(next);
      const catalogs = this.catalogs();
      if ((next.distritoId !== undefined && !catalogs?.distritos.some(d => d.id === next.distritoId)) ||
          (next.tipoEleccionId !== undefined && !catalogs?.elecciones.some(e => e.id === next.tipoEleccionId))) {
        throw new ApiError(400, 'VALIDATION_ERROR', 'Selecciona un distrito y una elección del catálogo.');
      }
    } catch (error) { this.errorValue.set(failure(error)); return; }
    if (actaParams(next).toString() === actaParams(this.query()).toString()) return;
    this.queryValue.set(next); this.resultValue.set(null); this.receivedAtValue.set(null); this.errorValue.set(null); this.querySource.next(next);
  }
  setFilters(filters: MonitorFilters): void {
    const { distritoId: _district, tipoEleccionId: _election, ...rest } = this.query();
    this.setQuery({ ...rest, ...filters, pagina: 1 });
  }
  setStatus(value: string): void {
    if (value !== '' && value !== 'Capturada' && value !== 'Pendiente') { this.errorValue.set(new ApiError(400, 'VALIDATION_ERROR', 'Estado de captura inválido.')); return; }
    const { estado: _status, ...rest } = this.query();
    this.setQuery({ ...rest, ...(value === '' ? {} : { estado: value }), pagina: 1 });
  }
  setLimit(limite: number): void { this.setQuery({ ...this.query(), limite, pagina: 1 }); }
  setPage(pagina: number): void {
    const result = this.result();
    if (this.loading() || !result || pagina < 1 || pagina > Math.max(1, result.totalPaginas)) return;
    this.setQuery({ ...this.query(), pagina });
  }
  reset(): void { this.setQuery({ pagina: 1, limite: this.query().limite }); }
  refresh(): void { this.refreshSource.next(); }
  reloadCatalogs(): void { this.catalogRetry.next(); }
}
