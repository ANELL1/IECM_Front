import { HttpErrorResponse, type HttpInterceptorFn } from '@angular/common/http';
import { catchError, from, switchMap, throwError } from 'rxjs';
import { ApiError } from './api-error.model';
import type { ApiErrorResponse } from './api-response.model';
function record(value: unknown): value is Record<string, unknown> { return typeof value === 'object' && value !== null; }
function isApiError(value: unknown): value is ApiErrorResponse {
  if (!record(value) || value['success'] !== false) return false;
  const error = value['error']; const meta = value['meta'];
  return record(error) && typeof error['code'] === 'string' && typeof error['message'] === 'string'
    && record(meta) && typeof meta['requestId'] === 'string';
}
export async function normalizeHttpError(error: HttpErrorResponse): Promise<ApiError> {
  let payload: unknown = error.error;
  if (payload instanceof Blob) {
    try { payload = JSON.parse(await payload.text()) as unknown; } catch { payload = undefined; }
  }
  if (isApiError(payload)) return new ApiError(error.status, payload.error.code, payload.error.message, payload.meta.requestId, payload.error.details);
  return new ApiError(error.status, error.status === 0 ? 'NETWORK_ERROR' : 'HTTP_ERROR',
    error.status === 0 ? 'No fue posible conectar con el servicio. Revisa la conexión e intenta nuevamente.' : 'No fue posible completar la solicitud.',
    error.headers.get('X-Request-Id'));
}
export const apiErrorInterceptor: HttpInterceptorFn = (request, next) => next(request).pipe(
  catchError((error: unknown) => error instanceof HttpErrorResponse
    ? from(normalizeHttpError(error)).pipe(switchMap(normalized => throwError(() => normalized)))
    : throwError(() => error)),
);
