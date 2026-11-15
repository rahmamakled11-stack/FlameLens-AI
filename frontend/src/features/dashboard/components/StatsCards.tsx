import { Database, FileText, FlaskConical, Layers, type LucideIcon } from "lucide-react";
import { getApiErrorMessage } from "@/api/client";
import { ErrorState } from "@/components/ui/ErrorState";
import { LoadingState } from "@/components/ui/LoadingState";
import type { DashboardSummary } from "@/features/dashboard/types/dashboard";

const cards: { key: keyof DashboardSummary; label: string; icon: LucideIcon }[] = [
  { key: "research_papers", label: "Publications", icon: FileText },
  { key: "experiments", label: "Experiments", icon: FlaskConical },
  { key: "research_areas", label: "Research Areas", icon: Layers },
  { key: "data_sources", label: "Sources", icon: Database },
];

interface StatsCardsProps {
  summary?: DashboardSummary;
  isLoading: boolean;
  isError: boolean;
  errorMessage: unknown;
  onRetry?: () => void;
}

export function StatsCards({ summary, isLoading, isError, errorMessage, onRetry }: StatsCardsProps) {
  if (isLoading) {
    return <LoadingState label="Loading dashboard statistics…" />;
  }

  if (isError) {
    return (
      <ErrorState
        message={getApiErrorMessage(errorMessage, "Failed to load dashboard summary.")}
        onRetry={onRetry}
      />
    );
  }

  if (!summary) {
    return <ErrorState message="Dashboard summary is unavailable." onRetry={onRetry} />;
  }

  return (
    <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
      {cards.map(({ key, label, icon: Icon }) => (
        <div key={key} className="rounded-xl border border-slate-800 bg-slate-800/60 p-5">
          <div className="mb-3 flex items-center justify-between">
            <span className="text-sm text-slate-400">{label}</span>
            <Icon className="h-4 w-4 text-amber-500" />
          </div>
          <p className="text-2xl font-bold text-white">
            {summary[key] === null ? "Not defined" : summary[key]}
          </p>
        </div>
      ))}
    </div>
  );
}
