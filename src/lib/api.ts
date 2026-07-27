export interface ApiErrorDetail {
  field?: string;
  message: string;
}

export class ApiError extends Error {
  code: string;
  status: number;
  details: ApiErrorDetail[];

  constructor(
    code: string,
    message: string,
    status: number,
    details: ApiErrorDetail[] = [],
  ) {
    super(message);
    this.name = "ApiError";
    this.code = code;
    this.status = status;
    this.details = details;
  }
}

async function apiFetch<T>(path: string, init?: RequestInit): Promise<T> {
  const res = await fetch(path, {
    credentials: "include",
    ...init,
    headers: {
      ...(init?.body ? { "content-type": "application/json" } : {}),
      ...init?.headers,
    },
  });

  const json = await res.json().catch(() => null);
  if (!res.ok || !json?.success) {
    throw new ApiError(
      json?.error?.code ?? "REQUEST_FAILED",
      json?.error?.message ?? "Something went wrong. Please try again.",
      res.status,
      json?.error?.details ?? [],
    );
  }
  return json.data as T;
}

export const apiGet = <T>(path: string) => apiFetch<T>(path);

export const apiPost = <T>(path: string, body?: unknown) =>
  apiFetch<T>(path, {
    method: "POST",
    body: body === undefined ? undefined : JSON.stringify(body),
  });

export const apiPatch = <T>(path: string, body?: unknown) =>
  apiFetch<T>(path, {
    method: "PATCH",
    body: body === undefined ? undefined : JSON.stringify(body),
  });
