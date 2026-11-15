interface ExperimentFiltersProps {
  program: string;
  mission: string;
  onProgram: (value: string) => void;
  onMission: (value: string) => void;
}

const inputClassName =
  "min-w-0 rounded-lg border border-slate-700 bg-slate-800 px-3 py-2.5 text-sm text-white outline-none placeholder:text-slate-500 focus:border-amber-500";

export function ExperimentFilters({
  program,
  mission,
  onProgram,
  onMission,
}: ExperimentFiltersProps) {
  return (
    <div className="flex flex-wrap items-center gap-3">
      <label className="sr-only" htmlFor="experiment-program-filter">Filter by program</label>
      <input
        id="experiment-program-filter"
        type="search"
        value={program}
        onChange={(event) => onProgram(event.target.value)}
        placeholder="Program"
        className={inputClassName}
      />
      <label className="sr-only" htmlFor="experiment-mission-filter">Filter by mission</label>
      <input
        id="experiment-mission-filter"
        type="search"
        value={mission}
        onChange={(event) => onMission(event.target.value)}
        placeholder="Mission"
        className={inputClassName}
      />
    </div>
  );
}
