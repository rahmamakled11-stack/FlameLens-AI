import { Link } from "react-router-dom";
import { Bot, Search } from "lucide-react";
import { useDashboardSummary } from "@/features/dashboard/hooks/useDashboardData";
import { EmptyState } from "@/components/ui/EmptyState";
import { StatsCards } from "@/features/dashboard/components/StatsCards";

export function DashboardPage() {
  const summaryQuery = useDashboardSummary();

  return (
    <div className="flex flex-col gap-6 p-6">
      <div>
        <h1 className="text-2xl font-bold text-white">Explore Combustion Science</h1>
        <p className="mt-1 text-sm text-slate-400">NASA Microgravity Research Intelligence</p>
      </div>

      <StatsCards
        summary={summaryQuery.data}
        isLoading={summaryQuery.isLoading}
        isError={summaryQuery.isError}
        errorMessage={summaryQuery.error}
        onRetry={() => summaryQuery.refetch()}
      />

      {summaryQuery.data &&
        summaryQuery.data.experiments === 0 &&
        summaryQuery.data.research_papers === 0 &&
        summaryQuery.data.data_sources === 0 && (
          <EmptyState
            title="No catalog records are available"
            description="The dashboard counts will update when catalog records are available."
          />
        )}

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <Link
          to="/experiments"
          className="flex items-center gap-3 rounded-xl border border-slate-800 bg-slate-800/60 p-4 transition hover:border-amber-500/50"
        >
          <Search className="h-5 w-5 text-amber-500" />
          <div>
            <p className="font-medium text-white">Search Experiments</p>
            <p className="text-xs text-slate-400">Find experiments by name or keyword</p>
          </div>
        </Link>
        <Link
          to="/assistant"
          className="flex items-center gap-3 rounded-xl border border-slate-800 bg-slate-800/60 p-4 transition hover:border-amber-500/50"
        >
          <Bot className="h-5 w-5 text-amber-500" />
          <div>
            <p className="font-medium text-white">AI Assistant</p>
            <p className="text-xs text-slate-400">Ask questions about combustion research</p>
          </div>
        </Link>
      </div>

    </div>
  );
}
