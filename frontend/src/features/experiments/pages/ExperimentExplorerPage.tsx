import { ChevronLeft, ChevronRight } from "lucide-react";
import { useEffect, useState } from "react";
import { useExperiments } from "@/features/experiments/hooks/useExperiments";
import { ExperimentFilters } from "@/features/experiments/components/ExperimentFilters";
import { ExperimentGrid } from "@/features/experiments/components/ExperimentGrid";
import { ExperimentSearch } from "@/features/experiments/components/ExperimentSearch";

const PAGE_SIZE = 9;

export function ExperimentExplorerPage() {
  const [search, setSearch] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [program, setProgram] = useState("");
  const [mission, setMission] = useState("");
  const [page, setPage] = useState(1);

  useEffect(() => {
    const timer = window.setTimeout(() => {
      setDebouncedSearch(search);
      setPage(1);
    }, 350);

    return () => window.clearTimeout(timer);
  }, [search]);

  const { data, error, isLoading, isError, refetch } = useExperiments({
    search: debouncedSearch,
    program,
    mission,
    page,
    pageSize: PAGE_SIZE,
  });

  const totalPages = data?.meta.last_page ?? 1;

  const resetPage = (setter: (value: string) => void) => (value: string) => {
    setter(value);
    setPage(1);
  };

  return (
    <div className="flex flex-col gap-6 p-6">
      <div>
        <h1 className="text-2xl font-bold text-white">Experiment Explorer</h1>
        <p className="mt-1 text-sm text-slate-400">Browse NASA microgravity combustion experiments</p>
      </div>

      <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
        <ExperimentSearch value={search} onChange={setSearch} />
        <ExperimentFilters
          program={program}
          mission={mission}
          onProgram={resetPage(setProgram)}
          onMission={resetPage(setMission)}
        />
      </div>

      <ExperimentGrid
        experiments={data?.data}
        isLoading={isLoading}
        isError={isError}
        error={error}
        refetch={() => void refetch()}
      />

      {data && data.meta.total > 0 && (
        <nav className="flex items-center justify-between text-sm text-slate-400" aria-label="Experiment pages">
          <span aria-live="polite">
            Page {data.meta.current_page} of {totalPages} ({data.meta.total} experiments)
          </span>
          <div className="flex items-center gap-2">
            <button
              type="button"
              aria-label="Previous experiment page"
              disabled={data.meta.current_page <= 1 || isLoading}
              onClick={() => setPage(data.meta.current_page - 1)}
              className="flex items-center gap-1 rounded-lg border border-slate-700 px-3 py-1.5 hover:border-amber-500 disabled:opacity-40"
            >
              <ChevronLeft className="h-4 w-4" /> Prev
            </button>
            <button
              type="button"
              aria-label="Next experiment page"
              disabled={data.meta.current_page >= totalPages || isLoading}
              onClick={() => setPage(data.meta.current_page + 1)}
              className="flex items-center gap-1 rounded-lg border border-slate-700 px-3 py-1.5 hover:border-amber-500 disabled:opacity-40"
            >
              Next <ChevronRight className="h-4 w-4" />
            </button>
          </div>
        </nav>
      )}
    </div>
  );
}
