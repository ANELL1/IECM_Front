import { inject, Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { defer } from 'rxjs';
import { PUBLIC_CONFIG } from '../../../core/config/public-config';
import type { ApiResponse } from '../../../core/http/api-response.model';
import type { DetailRow, GroupRow, Metrics, MonitorFilters, MonitorSnapshot, ServiceHealth, StatisticsMeta } from '../models/monitor.model';
import { monitorParams } from './query-params';
@Injectable({ providedIn: 'root' })
export class MonitorApiService {
  private readonly http = inject(HttpClient);
  private readonly base = inject(PUBLIC_CONFIG).apiBaseUrl;
  getMonitor(filters: MonitorFilters = {}) {
    return defer(() => this.http.get<ApiResponse<MonitorSnapshot>>(`${this.base}/monitor`, { params: monitorParams(filters) }));
  }
  getSummary(filters: MonitorFilters = {}) { return this.section<Metrics>('resumen', filters); }
  getDistricts(filters: MonitorFilters = {}) { return this.section<GroupRow[]>('estadisticas/distritos', filters); }
  getElections(filters: MonitorFilters = {}) { return this.section<GroupRow[]>('estadisticas/elecciones', filters); }
  getDetail(filters: MonitorFilters = {}) { return this.section<DetailRow[]>('detalle', filters); }
  getHealth() { return this.http.get<ApiResponse<ServiceHealth>>(`${this.base}/health`); }
  private section<T>(path: string, filters: MonitorFilters) {
    return defer(() => this.http.get<ApiResponse<T, StatisticsMeta>>(`${this.base}/${path}`, { params: monitorParams(filters) }));
  }
}
