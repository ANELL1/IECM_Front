export interface ApiMeta { requestId: string }
export interface ApiResponse<T, M extends ApiMeta = ApiMeta> { success: true; data: T; meta: M }
export interface ApiErrorResponse {
  success: false;
  error: { code: string; message: string; details?: unknown };
  meta: ApiMeta;
}
