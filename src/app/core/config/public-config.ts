import { inject, Injectable, InjectionToken } from '@angular/core';
import { HttpBackend, HttpClient } from '@angular/common/http';
import { firstValueFrom, timeout } from 'rxjs';

export interface PublicConfig { readonly apiBaseUrl: string; readonly refreshIntervalMs: number }
export function parsePublicConfig(value: unknown): PublicConfig {
  if (typeof value !== 'object' || value === null) throw new Error('Configuración pública inválida.');
  const object = value as Record<string, unknown>;
  if (Object.keys(object).some(key => !['apiBaseUrl', 'refreshIntervalMs'].includes(key))) throw new Error('Configuración pública con campos no permitidos.');
  const base = object['apiBaseUrl'];
  const interval = object['refreshIntervalMs'];
  if (typeof base !== 'string' || !base || base !== base.trim() || /[?#\\]/.test(base)) throw new Error('URL de API inválida.');
  const local = base.startsWith('/') && !base.startsWith('//');
  const url = new URL(base, 'http://localhost');
  if ((!local && !/^https?:\/\//.test(base)) || !['http:', 'https:'].includes(url.protocol) || url.username || url.password) throw new Error('URL de API inválida.');
  if (typeof interval !== 'number' || !Number.isInteger(interval) || interval < 5000 || interval > 300000) throw new Error('Intervalo de actualización inválido.');
  const apiBaseUrl = base.replace(/\/+$/, '');
  if (!apiBaseUrl) throw new Error('URL de API inválida.');
  return Object.freeze({ apiBaseUrl, refreshIntervalMs: interval });
}
@Injectable({ providedIn: 'root' })
export class PublicConfigService {
  private readonly http = new HttpClient(inject(HttpBackend));
  private config: PublicConfig | undefined;
  async load(): Promise<void> {
    this.config = parsePublicConfig(await firstValueFrom(this.http.get<unknown>('app-config.json').pipe(timeout(10000))));
  }
  get value(): PublicConfig {
    if (!this.config) throw new Error('La configuración pública aún no está disponible.');
    return this.config;
  }
}
export const PUBLIC_CONFIG = new InjectionToken<PublicConfig>('PUBLIC_CONFIG', { providedIn: 'root', factory: () => inject(PublicConfigService).value });
