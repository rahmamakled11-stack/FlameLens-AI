import axios from "axios";
import type { Stats, ActivityPoint, Experiment } from "@/types/experiment";

export const api = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL ?? "/api",
  timeout: 10000,
});

export const getStats = () => api.get<Stats>("/stats").then((r) => r.data);
export const getActivity = () => api.get<ActivityPoint[]>("/activity").then((r) => r.data);
export const getFeatured = () => api.get<Experiment[]>("/experiments/featured").then((r) => r.data);
export const getExperiments = (params: Record<string, string | number>) =>
  api.get<{ data: Experiment[]; total: number; page: number }>("/experiments", { params }).then((r) => r.data);
