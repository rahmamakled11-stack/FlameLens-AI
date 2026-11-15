import { Search } from "lucide-react";

interface ExperimentSearchProps {
  value: string;
  onChange: (value: string) => void;
}

export function ExperimentSearch({ value, onChange }: ExperimentSearchProps) {
  return (
    <div className="relative w-full md:max-w-md">
      <label htmlFor="experiment-search" className="sr-only">
        Search experiments
      </label>
      <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-500" />
      <input
        id="experiment-search"
        type="text"
        value={value}
        onChange={(event) => onChange(event.target.value)}
        placeholder="Search title, acronym, summary, or description…"
        autoComplete="off"
        className="w-full rounded-lg border border-slate-700 bg-slate-800 py-2.5 pl-10 pr-3 text-sm text-white placeholder-slate-500 outline-none focus:border-amber-500"
      />
    </div>
  );
}
