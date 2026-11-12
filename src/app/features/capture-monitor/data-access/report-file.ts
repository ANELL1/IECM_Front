import type { HttpResponse } from '@angular/common/http';
import { ApiError } from '../../../core/http/api-error.model';
import type { ReportFormat } from '../models/monitor.model';
const mimeTypes: Record<ReportFormat, string> = { pdf: 'application/pdf', xlsx: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' };
export function reportFilename(disposition: string | null, format: ReportFormat): string {
  const fallback = `avance-captura.${format}`;
  if (!disposition) return fallback;
  const encoded = /filename\*\s*=\s*UTF-8''([^;]+)/i.exec(disposition)?.[1];
  let name = /filename\s*=\s*"([^"]+)"/i.exec(disposition)?.[1] ?? /filename\s*=\s*([^;]+)/i.exec(disposition)?.[1];
  if (encoded) { try { name = decodeURIComponent(encoded.trim()); } catch { return fallback; } }
  if (!name) return fallback;
  // No aceptar rutas, controles, nombres excesivos ni una extensión distinta al formato pedido.
  name = name.trim();
  if (name.length > 150 || /[\/\\\x00-\x1f\x7f<>:"|?*]/.test(name) || name.startsWith('.') || !name.toLowerCase().endsWith(`.${format}`)) return fallback;
  return name;
}
export function reportFile(response: HttpResponse<Blob>, format: ReportFormat): { blob: Blob; filename: string } {
  const blob = response.body;
  const mime = (response.headers.get('Content-Type') ?? blob?.type ?? '').split(';')[0]?.trim().toLowerCase();
  if (!blob || blob.size === 0 || mime !== mimeTypes[format]) {
    throw new ApiError(502, 'INVALID_REPORT', 'El servicio devolvió un archivo vacío o con formato inesperado. Intenta nuevamente.', response.headers.get('X-Request-Id'));
  }
  return { blob, filename: reportFilename(response.headers.get('Content-Disposition'), format) };
}
