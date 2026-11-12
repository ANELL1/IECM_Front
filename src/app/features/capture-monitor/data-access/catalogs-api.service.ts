import { inject, Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { PUBLIC_CONFIG } from '../../../core/config/public-config';
import type { ApiResponse } from '../../../core/http/api-response.model';
import type { Catalogs } from '../models/monitor.model';
@Injectable({ providedIn: 'root' })
export class CatalogsApiService {
  private readonly http = inject(HttpClient);
  private readonly base = inject(PUBLIC_CONFIG).apiBaseUrl;
  getCatalogs() { return this.http.get<ApiResponse<Catalogs>>(`${this.base}/catalogos`); }
}
