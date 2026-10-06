// Centralized API client — wraps apiFetch with React Query compatible interface
import { apiFetch } from "./auth";

export class ApiError extends Error {
  constructor(public status: number, message: string) { super(message); }
}

async function handleResponse<T>(res: Response): Promise<T> {
  if (res.status === 401) throw new ApiError(401, "Session expired");
  // If response is not JSON (e.g., Vite dev-server HTML), throw instead of silently returning {}
  const contentType = res.headers.get('content-type') || '';
  if (!contentType.includes('application/json')) {
    throw new ApiError(res.status, 'Backend API not available');
  }
  const body = await res.json().catch(() => ({}));
  if (!res.ok) throw new ApiError(res.status, body.message || "Request failed");
  return body as T;
}

export const api = {
  get:    <T>(url: string)            => apiFetch(url).then(r => handleResponse<T>(r)),
  post:   <T>(url: string, data?: any) => apiFetch(url, { method: "POST",   body: JSON.stringify(data) }).then(r => handleResponse<T>(r)),
  patch:  <T>(url: string, data?: any) => apiFetch(url, { method: "PATCH",  body: JSON.stringify(data) }).then(r => handleResponse<T>(r)),
  delete: <T>(url: string)            => apiFetch(url, { method: "DELETE" }).then(r => handleResponse<T>(r)),
};
