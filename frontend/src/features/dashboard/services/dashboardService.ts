import { apiClient, type ApiEnvelope } from "@/api/client";
import type { DashboardSummary } from "@/features/dashboard/types/dashboard";

export const getDashboardSummary = async (): Promise<DashboardSummary> => {
  const { data } = await apiClient.get<ApiEnvelope<DashboardSummary>>("/dashboard/summary");
  return data.data;
};
