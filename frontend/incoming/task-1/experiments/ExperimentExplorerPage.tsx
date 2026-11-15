import { useState, useMemo } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { useExperiments } from "@/hooks/useExperiments";
import { ExperimentSearch } from "./components/ExperimentSearch";
import { ExperimentFilters } from "./components/ExperimentFilters";
import { ExperimentGrid } from "./components/ExperimentGrid";

const PAGE_SIZE = 9;
const CATEGORIES = ["Combustion", "Flame Spread", "Fire Safety", "Propellant", "Soot Formation"];

export default function ExperimentExplorerPage() {
  const [search, setSearch] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [category, setCategory] = useState("");
  const [availability, setAvailability] = useState("");
  const [page, setPage] = useState(1);

  // Debounce search input
  useMemo(() => {
    const t = setTimeout(() => { setDebouncedSearch(search); setPage(1); }, 350);
    return () => clearTimeout(t);
  }, [search]);

  const { data, isLoading, isError, refetch } = useExperiments({
    search: debouncedSearch,
    category,
    dataAvailability: availability,
    page,
    pageSize: PAGE_SIZE,
  });

  const totalPages = data ? Math.ceil(data.total / PAGE_SIZE) : 1;

  const resetPage = (fn: (v: string) => void) => (v: string) => {
    fn(v);
    setPage(1);
  };

  return (
    <div className="flex flex-col gap-6 p-6">
      <div>
        <h1 className="text-2xl font-bold text-white">Experiment Explorer</h1>
        <p className="mt-1 text-sm text-slate-400">
          Browse NASA microgravity combustion experiments
        </p>
      </div>

      <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
        <ExperimentSearch value={search} onChange={(v) => { setSearch(v); }} />
        <ExperimentFilters
          category={category}
          availability={availability}
          categories={CATEGORIES}
          onCategory={resetPage(setCategory)}
          onAvailability={resetPage(setAvailability)}
        />
      </div>

      <ExperimentGrid
        experiments={data?.data}
        isLoading={isLoading}
        isError={isError}
        refetch={refetch}
      />

      {/* Pagination */}
      {data && data.total > 0 && (
        <div className="flex items-center justify-between text-sm text-slate-400">
          <span>Page {page} of {totalPages}</span>
          <div className="flex items-center gap-2">
            <button disabled={page <= 1} onClick={() => setPage((p) => p - 1)}
              className="flex items-center gap-1 rounded-lg border border-slate-700 px-3 py-1.5 hover:border-amber-500 disabled:opacity-40">
              <ChevronLeft className="h-4 w-4" /> Prev
            </button>
            <button disabled={page >= totalPages} onClick={() => setPage((p) => p + 1)}
              className="flex items-center gap-1 rounded-lg border border-slate-700 px-3 py-1.5 hover:border-amber-500 disabled:opacity-40">
              Next <ChevronRight className="h-4 w-4" />
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
