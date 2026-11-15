import { Search } from "lucide-react";

interface Props {
  value: string;
  onChange: (v: string) => void;
}

export function ExperimentSearch({ value, onChange }: Props) {
  return (
    <div className="relative w-full md:max-w-md">
      <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-500" />
      <input
        type="text"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder="Search by name or keyword…"
        className="w-full rounded-lg border border-slate-700 bg-slate-800 py-2.5 pl-10 pr-3 text-sm text-white placeholder-slate-500 outline-none focus:border-amber-500"
      />
    </div>
  );
}
