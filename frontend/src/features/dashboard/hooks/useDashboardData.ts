import { useQuery } from "@tanstack/react-query";
import { getDashboardSummary } from "@/features/dashboard/services/dashboardService";

export const useDashboardSummary = () =>
  useQuery({
    queryKey: ["dashboard", "summary"],
    queryFn: getDashboardSummary,
    retry: false,
  });
