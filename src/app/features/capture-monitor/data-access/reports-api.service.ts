import { inject, Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { defer } from 'rxjs';
import { PUBLIC_CONFIG } from '../../../core/config/public-config';
import type { ReportFormat, ReportQuery } from '../models/monitor.model';
import { reportParams } from './query-params';
@Injectable({ providedIn: 'root' })
export class ReportsApiService {
  private readonly http = inject(HttpClient);
  private readonly base = inject(PUBLIC_CONFIG).apiBaseUrl;
  getReport(format: ReportFormat, query: ReportQuery) {
    return defer(() => this.http.get(`${this.base}/reportes/${format}`, { params: reportParams(query), responseType: 'blob', observe: 'response' }));
  }
}
