import { Route, Routes } from "react-router-dom";
import { AppShell } from "@/app/layouts/AppShell";
import { DashboardPage } from "@/features/dashboard/pages/DashboardPage";
import { ExperimentExplorerPage } from "@/features/experiments/pages/ExperimentExplorerPage";
import { ExperimentDetailsPage } from "@/features/experiments/pages/ExperimentDetailsPage";
import { ComparisonPage } from "@/features/comparison/pages/ComparisonPage";
import { AssistantPage } from "@/features/assistant/pages/AssistantPage";
import { EvidencePage } from "@/features/evidence/pages/EvidencePage";
import { NotFoundPage } from "@/pages/NotFoundPage";

export function AppRoutes() {
  return (
    <Routes>
      <Route element={<AppShell />}>
        <Route index element={<DashboardPage />} />
        <Route path="/experiments" element={<ExperimentExplorerPage />} />
        <Route path="/experiments/:experimentId" element={<ExperimentDetailsPage />} />
        <Route path="/compare" element={<ComparisonPage />} />
        <Route path="/assistant" element={<AssistantPage />} />
        <Route path="/evidence" element={<EvidencePage />} />
        <Route path="/evidence/:experimentId" element={<EvidencePage />} />
        <Route path="*" element={<NotFoundPage />} />
      </Route>
    </Routes>
  );
}
