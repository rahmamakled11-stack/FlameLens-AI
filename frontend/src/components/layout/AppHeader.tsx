import { Bell, Flame } from "lucide-react";

export function AppHeader() {
  return (
    <header className="flex items-center justify-between border-b border-slate-800 bg-slate-900/80 px-6 py-4 backdrop-blur">
      <div className="flex items-center gap-2">
        <Flame className="h-6 w-6 text-amber-500" />
        <span className="text-lg font-bold text-white">FlameLens AI</span>
      </div>
      <div className="flex items-center gap-4 text-slate-400">
        <button aria-label="Notifications" className="rounded-lg p-2 hover:bg-slate-800">
          <Bell className="h-5 w-5" />
        </button>
        <span className="hidden text-sm md:block">NASA Microgravity Research</span>
      </div>
    </header>
  );
}
