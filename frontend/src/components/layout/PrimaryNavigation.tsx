import { Home, FlaskConical, GitCompareArrows, Bot, FileText } from "lucide-react";
import { NavLink } from "react-router-dom";

const links = [
  { to: "/", label: "Dashboard", icon: Home },
  { to: "/experiments", label: "Experiments", icon: FlaskConical },
  { to: "/compare", label: "Comparison", icon: GitCompareArrows },
  { to: "/assistant", label: "AI Assistant", icon: Bot },
  { to: "/evidence", label: "Evidence Viewer", icon: FileText },
];

export function PrimaryNavigation() {
  return (
    <aside className="hidden w-56 shrink-0 border-r border-slate-800 bg-slate-900 p-4 md:block">
      <nav className="flex flex-col gap-1">
        {links.map(({ to, label, icon: Icon }) => (
          <NavLink
            key={to}
            to={to}
            end={to === "/"}
            className={({ isActive }) =>
              `flex items-center gap-3 rounded-lg px-3 py-2 text-sm ${
                isActive
                  ? "bg-amber-500/10 text-amber-400"
                  : "text-slate-400 hover:bg-slate-800 hover:text-white"
              }`
            }
          >
            <Icon className="h-4 w-4" /> {label}
          </NavLink>
        ))}
      </nav>
    </aside>
  );
}
