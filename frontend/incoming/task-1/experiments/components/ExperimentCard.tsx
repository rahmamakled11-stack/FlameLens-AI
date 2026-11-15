import { useNavigate } from "react-router-dom";
import { FlaskConical, ArrowRight } from "lucide-react";
import type { Experiment } from "@/types/experiment";

interface Props {
  experiment: Experiment;
}

export function ExperimentCard({ experiment }: Props) {
  const navigate = useNavigate();
  const available = experiment.dataAvailability === "available";

  return (
    <div
      onClick={() => navigate(`/experiments/${experiment.id}`)}
      role="button"
      tabIndex={0}
      onKeyDown={(e) => e.key === "Enter" && navigate(`/experiments/${experiment.id}`)}
      className="group flex cursor-pointer flex-col rounded-xl border border-slate-800 bg-slate-800/60 p-5 transition hover:border-amber-500/50"
    >
      <div className="mb-3 flex items-start justify-between">
        <span className="rounded bg-slate-700/60 px-2 py-1 text-xs font-medium text-amber-400">
          {experiment.category}
        </span>
        <FlaskConical className="h-5 w-5 text-slate-600 transition group-hover:text-amber-500" />
      </div>

      <h3 className="text-lg font-bold text-white">{experiment.name}</h3>
      <p className="mt-1 line-clamp-2 flex-1 text-sm text-slate-400">{experiment.description}</p>

      <div className="mt-4 flex items-center justify-between">
        <div className="text-xs">
          <span className="block text-slate-500">NASA ID</span>
          <span className="font-mono text-slate-300">{experiment.id}</span>
        </div>
        <span className={`text-xs font-medium ${available ? "text-emerald-400" : "text-slate-500"}`}>
          {available ? "● Available" : "○ Not available"}
        </span>
      </div>

      <button
        onClick={(e) => { e.stopPropagation(); navigate(`/experiments/${experiment.id}`); }}
        className="mt-4 flex w-full items-center justify-center gap-1 rounded-lg border border-slate-700 py-2 text-sm text-slate-300 transition hover:border-amber-500 hover:text-amber-400"
      >
        View Details <ArrowRight className="h-4 w-4" />
      </button>
    </div>
  );
}
