const FASTAPI_BASE_URL =
  process.env.FASTAPI_URL ?? "http://localhost:8000";

type FetchOptions = Omit<RequestInit, "body"> & {
  body?: unknown;
};

class FastAPIError extends Error {
  constructor(
    public status: number,
    public detail: string
  ) {
    super(`FastAPI Error ${status}: ${detail}`);
    this.name = "FastAPIError";
  }
}

async function apiFetch<T>(
  path: string,
  options: FetchOptions = {}
): Promise<T> {
  const { body, headers, ...rest } = options;

  const res = await fetch(`${FASTAPI_BASE_URL}${path}`, {
    ...rest,
    headers: {
      "Content-Type": "application/json",
      ...headers,
    },
    body: body !== undefined ? JSON.stringify(body) : undefined,
  });

  if (!res.ok) {
    const error = await res.json().catch(() => ({ detail: res.statusText }));
    throw new FastAPIError(res.status, error.detail ?? res.statusText);
  }

  return res.json() as Promise<T>;
}

export const fastapiClient = {
  get: <T>(path: string, options?: FetchOptions) =>
    apiFetch<T>(path, { ...options, method: "GET" }),
  post: <T>(path: string, body: unknown, options?: FetchOptions) =>
    apiFetch<T>(path, { ...options, method: "POST", body }),
  put: <T>(path: string, body: unknown, options?: FetchOptions) =>
    apiFetch<T>(path, { ...options, method: "PUT", body }),
  patch: <T>(path: string, body: unknown, options?: FetchOptions) =>
    apiFetch<T>(path, { ...options, method: "PATCH", body }),
  delete: <T>(path: string, options?: FetchOptions) =>
    apiFetch<T>(path, { ...options, method: "DELETE" }),
};

export { FastAPIError };
