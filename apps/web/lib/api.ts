export class ApiError extends Error {
  constructor(public status: number, public code: string, message: string, public details?: unknown) { super(message); }
}

type Options = RequestInit & { skipRefresh?: boolean };

export async function apiFetch<T = unknown>(path: string, options: Options = {}): Promise<T> {
  const headers = new Headers(options.headers);
  if (options.body && !headers.has('content-type')) headers.set('content-type', 'application/json');
  const csrf = typeof window !== 'undefined' ? sessionStorage.getItem('orderflow_csrf') : null;
  if (csrf && !['GET', 'HEAD'].includes((options.method ?? 'GET').toUpperCase())) headers.set('x-csrf-token', csrf);

  let response = await fetch(`/api/proxy${path}`, { ...options, headers, credentials: 'include', cache: 'no-store' });
  const cannotRefresh = ['/auth/login', '/auth/register', '/auth/refresh'].includes(path);
  if (response.status === 401 && !options.skipRefresh && !cannotRefresh) {
    const refreshed = await fetch('/api/proxy/auth/refresh', { method: 'POST', credentials: 'include', cache: 'no-store' });
    if (refreshed.ok) {
      const payload = await refreshed.json();
      if (payload.csrfToken) sessionStorage.setItem('orderflow_csrf', payload.csrfToken);
      const retryHeaders = new Headers(headers);
      if (payload.csrfToken && !['GET', 'HEAD'].includes((options.method ?? 'GET').toUpperCase())) retryHeaders.set('x-csrf-token', payload.csrfToken);
      response = await fetch(`/api/proxy${path}`, { ...options, headers: retryHeaders, credentials: 'include', cache: 'no-store' });
    }
  }

  if (response.status === 204) return undefined as T;
  const data = await response.json().catch(() => ({}));
  if (!response.ok) throw new ApiError(response.status, data.code ?? 'REQUEST_ERROR', data.message ?? 'Falha na solicitação.', data.details);
  return data as T;
}
