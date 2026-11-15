import { SearchX, AlertTriangle, Loader2 } from "lucide-react";
import type { Experiment } from "@/types/experiment";
import { ExperimentCard } from "./ExperimentCard";

interface Props {
  experiments?: Experiment[];
  isLoading: boolean;
  isError: boolean;
  refetch: () => void;
}

export function ExperimentGrid({ experiments, isLoading, isError, refetch }: Props) {
  if (isLoading)
    return (
      <div className="flex flex-col items-center justify-center gap-3 py-20 text-slate-400">
        <Loader2 className="h-8 w-8 animate-spin text-amber-500" />
        <p className="text-sm">Loading experiments…</p>
      </div>
    );

  if (isError)
    return (
      <div className="flex flex-col items-center justify-center gap-3 rounded-xl border border-rose-900/50 bg-rose-950/20 py-16 text-center">
        <AlertTriangle className="h-8 w-8 text-rose-400" />
        <p className="text-sm text-rose-300">Something went wrong while loading experiments.</p>
        <button onClick={refetch}
          className="rounded-lg border border-rose-800 px-4 py-2 text-sm text-rose-300 hover:bg-rose-950/40">
          Try again
        </button>
      </div>
    );

  if (!experiments?.length)
    return (
      <div className="flex flex-col items-center justify-center gap-3 rounded-xl border border-slate-800 py-16 text-center">
        <SearchX className="h-10 w-10 text-slate-600" />
        <p className="font-medium text-slate-300">No experiments found</p>
        <p className="text-sm text-slate-500">Try changing your search or filters.</p>
      </div>
    );

  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
      {experiments.map((exp) => (
        <ExperimentCard key={exp.id} experiment={exp} />
      ))}
    </div>
  );
}
