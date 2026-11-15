import { Link } from "react-router-dom";
import { FlaskConical, ArrowRight } from "lucide-react";
import { useFeatured } from "@/hooks/useExperiments";

export function FeaturedExperiments() {
  const { data, isLoading, isError } = useFeatured();

  return (
    <section>
      <div className="mb-3 flex items-center justify-between">
        <h2 className="text-lg font-semibold text-white">Featured Investigations</h2>
        <Link to="/experiments" className="flex items-center gap-1 text-sm text-amber-400 hover:underline">
          View all <ArrowRight className="h-4 w-4" />
        </Link>
      </div>

      {isLoading && (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-28 animate-pulse rounded-xl bg-slate-800" />
          ))}
        </div>
      )}

      {isError && <p className="text-sm text-rose-400">Failed to load featured experiments.</p>}

      {data && (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
          {data.map((exp) => (
            <Link
              key={exp.id}
              to={`/experiments/${exp.id}`}
              className="group rounded-xl border border-slate-800 bg-slate-800/60 p-5 transition hover:border-amber-500/50"
            >
              <div className="mb-4 flex items-start justify-between">
                <span className="text-lg font-bold text-white">{exp.name}</span>
                <FlaskConical className="h-5 w-5 text-amber-500" />
              </div>
              <p className="mb-3 line-clamp-2 text-sm text-slate-400">{exp.description}</p>
              <span className={`text-xs font-medium ${exp.dataAvailability === "available" ? "text-emerald-400" : "text-slate-500"}`}>
                {exp.dataAvailability === "available" ? "● Data Available" : "○ Data Unavailable"}
              </span>
            </Link>
          ))}
        </div>
      )}
    </section>
  );
}
