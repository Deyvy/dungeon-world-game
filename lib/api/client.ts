import { WizardError, WizardErrorCategory } from "./types";

const API_ORIGIN = process.env.API_ORIGIN ?? "http://localhost:3001";

export type FetchOptions = Omit<RequestInit, "body"> & {
  body?: unknown;
};

function buildUrl(path: string): string {
  const base = path.startsWith("/") ? path : `/${path}`;
  return `${API_ORIGIN}${base}`;
}

function normalizeError(
  cause: unknown,
  operation: string,
  status?: number
): WizardError {
  if (cause instanceof Error && "name" in cause && cause.name === "TypeError") {
    return {
      category: "network",
      message: "No se pudo conectar con el servidor.",
      operation,
      details: cause.message,
    };
  }

  if (cause && typeof cause === "object") {
    const candidate = cause as Partial<WizardError> & {
      statusCode?: number;
      message?: string | string[];
      error?: string;
      code?: string;
    };

    if (candidate.category && candidate.message) {
      return {
        category: candidate.category as WizardErrorCategory,
        message: candidate.message,
        status: candidate.status,
        operation: candidate.operation ?? operation,
        field: candidate.field,
        details: candidate.details,
      };
    }

    const httpStatus = status ?? candidate.statusCode;
    const rawMessage = candidate.message;

    if (httpStatus === 400) {
      const text = Array.isArray(rawMessage)
        ? rawMessage.join("; ")
        : typeof rawMessage === "string"
          ? rawMessage
          : "La solicitud no es válida.";
      return {
        category: "validation",
        message: text,
        status: httpStatus,
        operation,
        details: cause,
      };
    }

    if (httpStatus === 404 || candidate.code === "P2025") {
      return {
        category: "not_found",
        message: typeof rawMessage === "string" ? rawMessage : "No se encontró el recurso.",
        status: httpStatus,
        operation,
        details: cause,
      };
    }
  }

  return {
    category: "operation",
    message: "Ocurrió un error inesperado. Inténtalo de nuevo.",
    status,
    operation,
    details: cause,
  };
}

export async function apiFetch<T>(
  path: string,
  options: FetchOptions = {}
): Promise<T> {
  const operation =
    typeof options.method === "string" ? options.method : "GET";
  const url = buildUrl(path);

  const { body: requestBody, ...restOptions } = options;
  const init: RequestInit = {
    ...restOptions,
    headers: {
      "Content-Type": "application/json",
      Accept: "application/json",
      ...(options.headers ?? {}),
    },
  };

  if (requestBody !== undefined) {
    init.body = JSON.stringify(requestBody);
  }

  let response: Response;
  try {
    response = await fetch(url, init);
  } catch (networkError) {
    throw normalizeError(networkError, operation);
  }

  if (response.status === 204) {
    return undefined as T;
  }

  let payload: unknown;
  try {
    payload = await response.json();
  } catch {
    payload = undefined;
  }

  if (!response.ok) {
    throw normalizeError(payload ?? {}, operation, response.status);
  }

  return payload as T;
}

export async function apiFetchRelative<T>(
  path: string,
  options: FetchOptions = {}
): Promise<T> {
  const operation =
    typeof options.method === "string" ? options.method : "GET";
  const safePath = path.startsWith("/") ? path : `/${path}`;

  const { body: requestBody, ...restOptions } = options;
  const init: RequestInit = {
    ...restOptions,
    headers: {
      "Content-Type": "application/json",
      Accept: "application/json",
      ...(options.headers ?? {}),
    },
  };

  if (requestBody !== undefined) {
    init.body = JSON.stringify(requestBody);
  }

  let response: Response;
  try {
    response = await fetch(safePath, init);
  } catch (networkError) {
    throw normalizeError(networkError, operation);
  }

  if (response.status === 204) {
    return undefined as T;
  }

  let payload: unknown;
  try {
    payload = await response.json();
  } catch {
    payload = undefined;
  }

  if (!response.ok) {
    throw normalizeError(payload ?? {}, operation, response.status);
  }

  return payload as T;
}
