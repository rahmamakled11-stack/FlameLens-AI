import { ArrowRight, FlaskConical } from "lucide-react";
import { Link } from "react-router-dom";
import type { Experiment } from "@/features/experiments/types/experiment";

interface ExperimentCardProps {
  experiment: Experiment;
}

export function ExperimentCard({ experiment }: ExperimentCardProps) {
  return (
    <Link
      to={`/experiments/${experiment.id}`}
      aria-label={`View details for ${experiment.title}`}
      className="group flex cursor-pointer flex-col rounded-xl border border-slate-800 bg-slate-800/60 p-5 transition hover:border-amber-500/50 focus-visible:outline focus-visible:outline-2 focus-visible:outline-amber-500"
    >
      <div className="mb-3 flex items-start justify-between">
        <div className="flex flex-wrap gap-2">
          {experiment.program && (
            <span className="rounded bg-slate-700/60 px-2 py-1 text-xs font-medium text-amber-400">
              {experiment.program}
            </span>
          )}
          {experiment.mission && (
            <span className="rounded bg-slate-700/60 px-2 py-1 text-xs font-medium text-slate-300">
              {experiment.mission}
            </span>
          )}
        </div>
        <FlaskConical className="h-5 w-5 text-slate-600 transition group-hover:text-amber-500" />
      </div>

      <h3 className="text-lg font-bold text-white">{experiment.title}</h3>
      {experiment.acronym && <p className="mt-1 text-sm text-amber-300">{experiment.acronym}</p>}
      <p className="mt-2 line-clamp-3 flex-1 text-sm text-slate-400">
        {experiment.summary ?? experiment.description ?? "Description unavailable in stored record."}
      </p>

      <div className="mt-4 flex items-end justify-between gap-3">
        {experiment.nasa_identifier ? (
          <div className="text-xs">
            <span className="block text-slate-500">NASA identifier</span>
            <span className="font-mono text-slate-300">{experiment.nasa_identifier}</span>
          </div>
        ) : (
          <span className="text-xs text-slate-500">NASA identifier not provided</span>
        )}
        <span className="text-xs text-slate-500">
          {experiment.source_count} {experiment.source_count === 1 ? "source" : "sources"}
        </span>
      </div>

      <span className="mt-4 flex items-center gap-1 text-sm text-amber-400">
        View details <ArrowRight className="h-4 w-4" />
      </span>
    </Link>
  );
}
