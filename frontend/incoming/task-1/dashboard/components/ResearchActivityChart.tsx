import {
  ResponsiveContainer, AreaChart, Area, XAxis, YAxis,
  CartesianGrid, Tooltip, Legend,
} from "recharts";
import { useActivity } from "@/hooks/useExperiments";

export function ResearchActivityChart() {
  const { data, isLoading, isError } = useActivity();

  return (
    <section className="rounded-xl border border-slate-800 bg-slate-800/60 p-5">
      <h2 className="mb-4 text-lg font-semibold text-white">Research Activity</h2>

      {isLoading && (
        <div className="flex h-64 animate-pulse items-center justify-center rounded-lg bg-slate-800 text-slate-500">
          Loading chart…
        </div>
      )}

      {isError && (
        <div className="flex h-64 items-center justify-center text-sm text-rose-400">
          Could not load research activity data.
        </div>
      )}

      {data && (
        <div className="h-64">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={data} margin={{ top: 8, right: 8, left: -16, bottom: 0 }}>
              <defs>
                <linearGradient id="papers" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#f59e0b" stopOpacity={0.5} />
                  <stop offset="100%" stopColor="#f59e0b" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid stroke="#1e293b" strokeDasharray="3 3" />
              <XAxis dataKey="month" stroke="#64748b" fontSize={12} />
              <YAxis stroke="#64748b" fontSize={12} />
              <Tooltip contentStyle={{ background: "#0f172a", border: "1px solid #1e293b", borderRadius: 8 }}
                       labelStyle={{ color: "#e2e8f0" }} itemStyle={{ color: "#f59e0b" }} />
              <Legend wrapperStyle={{ color: "#94a3b8", fontSize: 12 }} />
              <Area type="monotone" dataKey="papers" name="Papers" stroke="#f59e0b" fill="url(#papers)" strokeWidth={2} />
              <Area type="monotone" dataKey="experiments" name="Experiments" stroke="#38bdf8" fill="transparent" strokeWidth={2} />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      )}
    </section>
  );
}
