export class ApiError extends Error {
  constructor(public readonly status: number, public readonly code: string, message: string,
    public readonly requestId: string | null = null, public readonly details: unknown = undefined) {
    super(message); this.name = 'ApiError';
  }
}
