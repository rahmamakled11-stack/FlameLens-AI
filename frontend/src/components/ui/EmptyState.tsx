import { SearchX } from "lucide-react";

interface EmptyStateProps {
  title: string;
  description?: string;
}

export function EmptyState({ title, description }: EmptyStateProps) {
  return (
    <div className="flex flex-col items-center justify-center gap-3 rounded-xl border border-slate-800 py-16 text-center">
      <SearchX className="h-10 w-10 text-slate-600" />
      <p className="font-medium text-slate-300">{title}</p>
      {description && <p className="text-sm text-slate-500">{description}</p>}
    </div>
  );
}
