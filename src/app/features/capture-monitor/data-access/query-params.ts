import { HttpParams } from '@angular/common/http';
import { ApiError } from '../../../core/http/api-error.model';
import type { ActaQuery, MonitorFilters, ReportQuery } from '../models/monitor.model';
function invalid(): never { throw new ApiError(400, 'VALIDATION_ERROR', 'Revisa los filtros y la paginación.'); }
function integer(value: number, max: number): number { if (!Number.isInteger(value) || value < 1 || value > max) invalid(); return value; }
export function monitorParams(filters: MonitorFilters): HttpParams {
  let params = new HttpParams();
  if (filters.distritoId !== undefined) params = params.set('distritoId', integer(filters.distritoId, 2147483647));
  if (filters.tipoEleccionId !== undefined) params = params.set('tipoEleccionId', integer(filters.tipoEleccionId, 2147483647));
  return params;
}
export function actaParams(query: ActaQuery): HttpParams {
  let params = monitorParams(query).set('pagina', integer(query.pagina ?? 1, 1000000)).set('limite', integer(query.limite ?? 25, 100));
  if (query.estado !== undefined) {
    if (query.estado !== 'Capturada' && query.estado !== 'Pendiente') invalid();
    params = params.set('estado', query.estado);
  }
  return params;
}
export function reportParams(query: ReportQuery): HttpParams {
  if (query.corteId !== undefined) {
    if (query.distritoId !== undefined || query.tipoEleccionId !== undefined || !/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(query.corteId)) invalid();
    return new HttpParams().set('corteId', query.corteId);
  }
  return monitorParams(query);
}
