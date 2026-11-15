interface Props {
  category: string;
  availability: string;
  categories: string[];
  onCategory: (v: string) => void;
  onAvailability: (v: string) => void;
}

const selectCls =
  "rounded-lg border border-slate-700 bg-slate-800 px-3 py-2.5 text-sm text-white outline-none focus:border-amber-500";

export function ExperimentFilters({ category, availability, categories, onCategory, onAvailability }: Props) {
  return (
    <div className="flex flex-wrap items-center gap-3">
      <select value={category} onChange={(e) => onCategory(e.target.value)} className={selectCls} aria-label="Category">
        <option value="">All Categories</option>
        {categories.map((c) => (
          <option key={c} value={c}>{c}</option>
        ))}
      </select>
      <select value={availability} onChange={(e) => onAvailability(e.target.value)} className={selectCls} aria-label="Data availability">
        <option value="">All Data</option>
        <option value="available">Data Available</option>
        <option value="unavailable">Data Unavailable</option>
      </select>
    </div>
  );
}
