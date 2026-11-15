import axios from "axios";

export interface ApiErrorEnvelope {
  error: {
    code: string;
    message: string;
    details: Record<string, string[]>;
    request_id: string;
  };
}

export interface ApiEnvelope<T> {
  data: T;
  meta?: Record<string, unknown>;
}

export const apiClient = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL ?? "/api/v1",
  timeout: 10000,
});

export function getApiErrorMessage(error: unknown, fallback: string): string {
  if (axios.isAxiosError<ApiErrorEnvelope>(error)) {
    return error.response?.data.error?.message ?? fallback;
  }

  return fallback;
}
