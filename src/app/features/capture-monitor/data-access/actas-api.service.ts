import { inject, Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { defer } from 'rxjs';
import { PUBLIC_CONFIG } from '../../../core/config/public-config';
import type { ApiResponse } from '../../../core/http/api-response.model';
import type { ActaPage, ActaQuery } from '../models/monitor.model';
import { actaParams } from './query-params';
@Injectable({ providedIn: 'root' })
export class ActasApiService {
  private readonly http = inject(HttpClient);
  private readonly base = inject(PUBLIC_CONFIG).apiBaseUrl;
  getActas(query: ActaQuery = {}) {
    return defer(() => this.http.get<ApiResponse<ActaPage>>(`${this.base}/actas`, { params: actaParams(query) }));
  }
}
