// src/api.ts — backend-тэй харьцах fetch client
const BASE = "/cron-job/v1";
const TOKEN_KEY = "cj_token";

let token: string | null = localStorage.getItem(TOKEN_KEY);

export function getToken(): string | null {
  return token;
}
export function setToken(t: string | null): void {
  token = t;
  if (t) localStorage.setItem(TOKEN_KEY, t);
  else localStorage.removeItem(TOKEN_KEY);
}

export type ApiEnvelope<T> = {
  success: boolean;
  message: string;
  code: string;
  token?: string;
  count?: number;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  paginate?: Record<string, any>;
  data: T;
};

export class ApiError extends Error {
  status: number;
  constructor(message: string, status: number) {
    super(message);
    this.status = status;
  }
}

type ReqOpts = {
  method?: string;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  body?: any;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  query?: Record<string, any>;
};

function qs(query?: Record<string, unknown>): string {
  if (!query) return "";
  const parts = Object.entries(query)
    .filter(([, v]) => v !== undefined && v !== null && v !== "")
    .map(([k, v]) => `${encodeURIComponent(k)}=${encodeURIComponent(String(v))}`);
  return parts.length ? `?${parts.join("&")}` : "";
}

async function request<T>(path: string, opts: ReqOpts = {}): Promise<ApiEnvelope<T>> {
  const headers: Record<string, string> = { "Content-Type": "application/json" };
  if (token) headers["Authorization"] = `Bearer ${token}`;

  const res = await fetch(`${BASE}${path}${qs(opts.query)}`, {
    method: opts.method || "GET",
    headers,
    body: opts.body !== undefined ? JSON.stringify(opts.body) : undefined
  });

  if (res.status === 401) {
    setToken(null);
    window.dispatchEvent(new Event("cj:unauthorized"));
  }

  let json: ApiEnvelope<T>;
  try {
    json = (await res.json()) as ApiEnvelope<T>;
  } catch {
    throw new ApiError("Сервертэй холбогдоход алдаа гарлаа", res.status);
  }

  if (!res.ok || json.success === false) {
    throw new ApiError(json?.message || "Алдаа гарлаа", res.status);
  }
  return json;
}

/* ------------------------- Types ------------------------- */
export type JobEnv = "prod" | "staging" | "test" | "dev";

export type Job = {
  _id: string;
  id: string;
  type_name: JobEnv;
  job_time: string;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  config: any;
  status: boolean;
  log_enabled: boolean;
  createdAt: string;
  updatedAt: string;
};

export type JobLog = {
  _id: string;
  job_id: string;
  type_name: JobEnv;
  status: "success" | "error";
  http_code: number | null;
  duration_ms: number;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  request_config: any;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  response_body: any;
  error_message: string | null;
  createdAt: string;
};

export type ApiKey = {
  _id: string;
  name: string;
  display: string;
  status: boolean;
  last_used_at: string | null;
  createdAt: string;
};

export type Retention = { enabled: boolean; days: number };
export type SettingsData = {
  retention: Retention;
  stats: { jobs: number; activeJobs: number; logs: number; apiKeys: number };
};

/* ------------------------- Endpoints ------------------------- */
export const api = {
  auth: {
    login: (username: string, password: string) =>
      request<{ username: string; role: string }>("/admin/auth/login", {
        method: "POST",
        body: { username, password }
      }),
    me: () => request<{ username: string; role: string }>("/admin/auth/me")
  },
  jobs: {
    list: (query?: { type_name?: string; status?: string; q?: string }) =>
      request<Job[]>("/admin/jobs", { query }),
    get: (id: string) => request<Job & { recent_logs: JobLog[] }>(`/admin/jobs/${id}`),
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    create: (body: any) => request<Job>("/admin/jobs", { method: "POST", body }),
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    update: (id: string, body: any) =>
      request<Job>(`/admin/jobs/${id}`, { method: "PUT", body }),
    remove: (id: string) => request<null>(`/admin/jobs/${id}`, { method: "DELETE" }),
    start: (id: string) => request<Job>(`/admin/jobs/${id}/start`, { method: "POST" }),
    stop: (id: string) => request<Job>(`/admin/jobs/${id}/stop`, { method: "POST" }),
    toggleLog: (id: string, enabled: boolean) =>
      request<Job>(`/admin/jobs/${id}/log`, { method: "POST", body: { enabled } }),
    clearLogs: (id: string) =>
      request<{ deleted: number }>(`/admin/jobs/${id}/logs`, { method: "DELETE" })
  },
  apiKeys: {
    list: () => request<ApiKey[]>("/admin/api-keys"),
    create: (name: string) =>
      request<ApiKey & { key: string }>("/admin/api-keys", { method: "POST", body: { name } }),
    revoke: (id: string) => request<null>(`/admin/api-keys/${id}`, { method: "DELETE" })
  },
  logs: {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    list: (query?: Record<string, any>) => request<JobLog[]>("/admin/logs", { query }),
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    deleteFiltered: (query?: Record<string, any>) =>
      request<{ deleted: number }>("/admin/logs", { method: "DELETE", query })
  },
  settings: {
    get: () => request<SettingsData>("/admin/settings"),
    updateRetention: (body: Partial<Retention>) =>
      request<{ retention: Retention }>("/admin/settings/retention", { method: "PUT", body }),
    deleteWorkspace: () =>
      request<{ jobs: number; logs: number; api_keys: number }>(
        "/admin/settings/workspace",
        { method: "DELETE", body: { confirm: true } }
      )
  }
};
