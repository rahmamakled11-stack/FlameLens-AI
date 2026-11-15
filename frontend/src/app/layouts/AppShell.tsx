import { Outlet } from "react-router-dom";
import { AppHeader } from "@/components/layout/AppHeader";
import { PrimaryNavigation } from "@/components/layout/PrimaryNavigation";

export function AppShell() {
  return (
    <div className="flex min-h-screen bg-slate-950 text-slate-100">
      <PrimaryNavigation />
      <div className="flex min-w-0 flex-1 flex-col">
        <AppHeader />
        <main className="flex-1">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
