import { BrowserRouter, Routes, Route } from "react-router-dom";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Navbar } from "@/components/layout/Navbar";
import { Sidebar } from "@/components/layout/Sidebar";
import DashboardPage from "@/dashboard/DashboardPage";
import ExperimentExplorerPage from "@/experiments/ExperimentExplorerPage";

const queryClient = new QueryClient();

export default function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <BrowserRouter>
        <div className="flex min-h-screen bg-slate-950 text-slate-100">
          <Sidebar />
          <div className="flex min-w-0 flex-1 flex-col">
            <Navbar />
            <main className="flex-1">
              <Routes>
                <Route path="/" element={<DashboardPage />} />
                <Route path="/experiments" element={<ExperimentExplorerPage />} />
                <Route path="/experiments/:id" element={<div className="p-6 text-slate-400">Student 2 details page</div>} />
              </Routes>
            </main>
          </div>
        </div>
      </BrowserRouter>
    </QueryClientProvider>
  );
}
