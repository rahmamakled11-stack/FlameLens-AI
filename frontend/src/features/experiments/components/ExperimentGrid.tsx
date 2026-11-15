import { AlertTriangle, Loader2 } from "lucide-react";
import { EmptyState } from "@/components/ui/EmptyState";
import { getApiErrorMessage } from "@/api/client";
import type { Experiment } from "@/features/experiments/types/experiment";
import { ExperimentCard } from "@/features/experiments/components/ExperimentCard";

interface ExperimentGridProps {
  experiments?: Experiment[];
  isLoading: boolean;
  isError: boolean;
  error?: unknown;
  refetch: () => void;
}

export function ExperimentGrid({ experiments, isLoading, isError, error, refetch }: ExperimentGridProps) {
  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center gap-3 py-20 text-slate-400">
        <Loader2 className="h-8 w-8 animate-spin text-amber-500" />
        <p className="text-sm">Loading experiments…</p>
      </div>
    );
  }

  if (isError) {
    return (
      <div className="flex flex-col items-center justify-center gap-3 rounded-xl border border-rose-900/50 bg-rose-950/20 py-16 text-center">
        <AlertTriangle className="h-8 w-8 text-rose-400" />
        <p className="text-sm text-rose-300" role="alert">
          {getApiErrorMessage(error, "Something went wrong while loading experiments.")}
        </p>
        <button
          type="button"
          onClick={refetch}
          className="rounded-lg border border-rose-800 px-4 py-2 text-sm text-rose-300 hover:bg-rose-950/40"
        >
          Try again
        </button>
      </div>
    );
  }

  if (!experiments?.length) {
    return <EmptyState title="No experiments found" description="Try changing your search or filters." />;
  }

  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
      {experiments.map((experiment) => (
        <ExperimentCard key={experiment.id} experiment={experiment} />
      ))}
    </div>
  );
}
