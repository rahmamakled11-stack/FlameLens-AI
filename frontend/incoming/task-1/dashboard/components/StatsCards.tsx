import { FileText, FlaskConical, Layers, Database, type LucideIcon } from "lucide-react";
import { useStats } from "@/hooks/useExperiments";
import type { Stats } from "@/types/experiment";

const cards: { key: keyof Stats; label: string; icon: LucideIcon }[] = [
  { key: "researchPapers", label: "Research Papers", icon: FileText },
  { key: "experiments", label: "Experiments", icon: FlaskConical },
  { key: "researchAreas", label: "Research Areas", icon: Layers },
  { key: "dataSources", label: "Data Sources", icon: Database },
];

export function StatsCards() {
  const { data, isLoading, isError } = useStats();

  if (isLoading)
    return (
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        {cards.map((c) => (
          <div key={c.key} className="animate-pulse rounded-xl bg-slate-800 p-5">
            <div className="mb-3 h-3 w-24 rounded bg-slate-700" />
            <div className="h-8 w-16 rounded bg-slate-700" />
          </div>
        ))}
      </div>
    );

  if (isError)
    return <p className="text-sm text-rose-400">Failed to load statistics. Please try again.</p>;

  return (
    <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
      {cards.map(({ key, label, icon: Icon }) => (
        <div key={key} className="rounded-xl border border-slate-800 bg-slate-800/60 p-5">
          <div className="mb-3 flex items-center justify-between">
            <span className="text-sm text-slate-400">{label}</span>
            <Icon className="h-4 w-4 text-amber-500" />
          </div>
          <p className="text-2xl font-bold text-white">{data?.[key] ?? 0}</p>
        </div>
      ))}
    </div>
  );
}
