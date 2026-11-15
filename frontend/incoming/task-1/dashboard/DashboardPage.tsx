import { Link } from "react-router-dom";
import { Search, Bot } from "lucide-react";
import { StatsCards } from "./components/StatsCards";
import { ResearchActivityChart } from "./components/ResearchActivityChart";
import { FeaturedExperiments } from "./components/FeaturedExperiments";

export default function DashboardPage() {
  return (
    <div className="flex flex-col gap-6 p-6">
      {/* Welcome Section */}
      <div>
        <h1 className="text-2xl font-bold text-white">Explore Combustion Science</h1>
        <p className="mt-1 text-sm text-slate-400">NASA Microgravity Research Intelligence</p>
      </div>

      <StatsCards />

      {/* Quick Access */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <Link to="/experiments"
          className="flex items-center gap-3 rounded-xl border border-slate-800 bg-slate-800/60 p-4 transition hover:border-amber-500/50">
          <Search className="h-5 w-5 text-amber-500" />
          <div>
            <p className="font-medium text-white">Search Experiments</p>
            <p className="text-xs text-slate-400">Find experiments by name or keyword</p>
          </div>
        </Link>
        <Link to="/assistant"
          className="flex items-center gap-3 rounded-xl border border-slate-800 bg-slate-800/60 p-4 transition hover:border-amber-500/50">
          <Bot className="h-5 w-5 text-amber-500" />
          <div>
            <p className="font-medium text-white">AI Assistant</p>
            <p className="text-xs text-slate-400">Ask questions about combustion research</p>
          </div>
        </Link>
      </div>

      <ResearchActivityChart />
      <FeaturedExperiments />
    </div>
  );
}
