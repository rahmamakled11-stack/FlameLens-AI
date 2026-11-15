import { useState } from "react";
import { ExternalLink } from "lucide-react";
import { useQueries } from "@tanstack/react-query";
import { ErrorState } from "@/components/ui/ErrorState";
import { EmptyState } from "@/components/ui/EmptyState";
import { LoadingState } from "@/components/ui/LoadingState";
import { getApiErrorMessage } from "@/api/client";
import { useExperiments } from "@/features/experiments/hooks/useExperiments";
import { getExperimentById } from "@/features/experiments/services/experimentsService";
import type { ExperimentDetails, ExperimentSection } from "@/features/experiments/types/experiment";

const listParams = { search: "", program: "", mission: "", page: 1, pageSize: 100 };

function OriginalLink({ href, children }: { href: string; children: string }) {
  return (
    <a
      href={href}
      target="_blank"
      rel="noreferrer"
      className="inline-flex items-center gap-1 break-all text-amber-400 hover:underline"
    >
      {children} <ExternalLink className="h-3 w-3 shrink-0" aria-hidden="true" />
    </a>
  );
}

function sectionsOfType(experiment: ExperimentDetails, type: "objectives" | "methodology"): ExperimentSection[] {
  return experiment.sections.filter((section) => {
    const sectionType = section.section_type.toLowerCase();
    return type === "objectives"
      ? sectionType.includes("objective")
      : sectionType.includes("method");
  });
}

function SectionCell({
  sections,
  emptyText,
}: {
  sections: ExperimentSection[];
  emptyText: string;
}) {
  if (!sections.length) return <p className="text-sm text-slate-500">{emptyText}</p>;

  return (
    <div className="space-y-4">
      {sections.map((section) => (
        <div key={section.id}>
          <h4 className="font-medium text-slate-200">{section.title}</h4>
          <p className="mt-1 whitespace-pre-line text-sm text-slate-400">
            {section.content ?? "Section content unavailable in stored record."}
          </p>
          {section.source ? (
            <p className="mt-2 text-xs">
              <OriginalLink href={section.source.source_url}>Linked section source</OriginalLink>
            </p>
          ) : (
            <p className="mt-2 text-xs text-slate-500">No source is linked to this section.</p>
          )}
        </div>
      ))}
    </div>
  );
}

function FindingsCell({ experiment }: { experiment: ExperimentDetails }) {
  const findings = experiment.sections.filter(
    (section) => section.section_type.toLowerCase() === "findings" && section.source,
  );
  const unlinkedFindings = experiment.sections.some(
    (section) => section.section_type.toLowerCase() === "findings" && !section.source,
  );

  return (
    <div className="space-y-3">
      {findings.length ? (
        findings.map((section) => (
          <div key={section.id}>
            <h4 className="font-medium text-slate-200">{section.title}</h4>
            <p className="mt-1 whitespace-pre-line text-sm text-slate-400">
              {section.content ?? "Section content unavailable in stored record."}
            </p>
            {section.source && (
              <p className="mt-2 text-xs">
                <OriginalLink href={section.source.source_url}>Linked findings source</OriginalLink>
              </p>
            )}
          </div>
        ))
      ) : (
        <p className="text-sm text-slate-500">
          No source-linked findings section is stored for this record.
        </p>
      )}
      {unlinkedFindings && (
        <p className="text-xs text-slate-500">
          An unlinked findings section exists but is not presented as verified findings.
        </p>
      )}
    </div>
  );
}

function EvidenceList({ experiment }: { experiment: ExperimentDetails }) {
  return (
    <div className="space-y-4">
      <div>
        <h4 className="text-xs font-semibold uppercase tracking-wide text-slate-500">Publications</h4>
        {experiment.publications.length ? (
          <ul className="mt-2 space-y-2">
            {experiment.publications.map((publication) => (
              <li key={publication.id} className="text-sm text-slate-300">
                {publication.title}
                {publication.publication_url && (
                  <span className="mt-1 block">
                    <OriginalLink href={publication.publication_url}>Open publication</OriginalLink>
                  </span>
                )}
              </li>
            ))}
          </ul>
        ) : (
          <p className="mt-2 text-sm text-slate-500">No publications linked in stored record.</p>
        )}
      </div>
      <div>
        <h4 className="text-xs font-semibold uppercase tracking-wide text-slate-500">Sources</h4>
        {experiment.sources.length ? (
          <ul className="mt-2 space-y-2">
            {experiment.sources.map((source) => (
              <li key={source.id} className="text-sm text-slate-300">
                {source.title}
                <span className="mt-1 block text-xs text-slate-500">
                  {[source.publisher, source.source_type].filter(Boolean).join(" · ")}
                </span>
                <span className="mt-1 block">
                  <OriginalLink href={source.source_url}>Open source</OriginalLink>
                </span>
              </li>
            ))}
          </ul>
        ) : (
          <p className="mt-2 text-sm text-slate-500">No sources linked in stored record.</p>
        )}
      </div>
    </div>
  );
}

function MetricsCell({ experiment }: { experiment: ExperimentDetails }) {
  if (!experiment.metrics.length) {
    return <p className="text-sm text-slate-500">No metric records are stored.</p>;
  }

  return (
    <ul className="space-y-3">
      {experiment.metrics.map((metric) => (
        <li key={metric.id} className="text-sm text-slate-300">
          <span className="font-medium text-slate-200">{metric.metric_name}: </span>
          {metric.metric_value === null ? "Value unavailable" : metric.metric_value}
          {metric.metric_value !== null && metric.unit ? ` ${metric.unit}` : ""}
          {metric.conditions !== null && (
            <pre className="mt-1 overflow-x-auto whitespace-pre-wrap text-xs text-slate-500">
              Conditions: {JSON.stringify(metric.conditions)}
            </pre>
          )}
          {metric.source && (
            <span className="mt-1 block text-xs">
              <OriginalLink href={metric.source.source_url}>Metric source</OriginalLink>
            </span>
          )}
        </li>
      ))}
    </ul>
  );
}

export function ComparisonPage() {
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const experimentsQuery = useExperiments(listParams);
  const detailQueries = useQueries({
    queries: selectedIds.map((id) => ({
      queryKey: ["experiments", "detail", id],
      queryFn: () => getExperimentById(id),
      retry: false,
    })),
  });
  const selectedDetails = detailQueries.flatMap((query) => query.data ? [query.data] : []);
  const hasDetailError = detailQueries.some((query) => query.isError);
  const isLoadingDetails = detailQueries.some((query) => query.isLoading);
  const quantitativeDataExists = selectedDetails.some((experiment) => experiment.metrics.length > 0);

  const toggleExperiment = (id: string, checked: boolean) => {
    setSelectedIds((current) =>
      checked ? [...current, id] : current.filter((selectedId) => selectedId !== id),
    );
  };

  return (
    <div className="flex flex-col gap-6 p-6">
      <header>
        <h1 className="text-2xl font-bold text-white">Scientific Experiment Comparison</h1>
        <p className="mt-1 text-sm text-slate-400">
          Compare stored catalog fields and source-linked sections. No scientific values are inferred.
        </p>
      </header>

      {experimentsQuery.isLoading ? (
        <LoadingState label="Loading experiments…" />
      ) : experimentsQuery.isError ? (
        <ErrorState
          message={getApiErrorMessage(experimentsQuery.error, "Could not load experiments.")}
          onRetry={() => void experimentsQuery.refetch()}
        />
      ) : !experimentsQuery.data?.data.length ? (
        <EmptyState title="No experiments are available to compare" />
      ) : (
        <fieldset className="rounded-xl border border-slate-800 bg-slate-800/40 p-5">
          <legend className="px-2 text-sm font-medium text-slate-300">
            Select at least two experiments ({selectedIds.length} selected)
          </legend>
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {experimentsQuery.data.data.map((experiment) => (
              <label
                key={experiment.id}
                className="flex cursor-pointer items-start gap-3 rounded-lg border border-slate-700 bg-slate-900/60 p-3"
              >
                <input
                  type="checkbox"
                  checked={selectedIds.includes(experiment.id)}
                  onChange={(event) => toggleExperiment(experiment.id, event.target.checked)}
                  aria-label={`Compare ${experiment.title}`}
                  className="mt-1 accent-amber-500"
                />
                <span>
                  <span className="block font-medium text-white">{experiment.title}</span>
                  {experiment.acronym && <span className="text-sm text-amber-300">{experiment.acronym}</span>}
                </span>
              </label>
            ))}
          </div>
        </fieldset>
      )}

      {selectedIds.length === 1 && (
        <p className="text-sm text-slate-400" role="status">Select one more experiment to compare records.</p>
      )}

      {selectedIds.length >= 2 && (
        <>
          <aside className="rounded-lg border border-amber-500/30 bg-amber-500/5 p-4 text-sm text-amber-100" role="note">
            {quantitativeDataExists
              ? "Stored metrics are listed as recorded. Values are not normalized or assessed for unit and condition compatibility; no quantitative conclusion is calculated."
              : "Quantitative comparison is unavailable: the selected records contain no persisted metric records. Missing metrics do not mean zero measurements or negative findings."}
          </aside>

          {isLoadingDetails && <LoadingState label="Loading selected experiment details…" />}
          {hasDetailError && (
            <ErrorState
              message="One or more selected experiment records could not be loaded."
              onRetry={() => void Promise.all(detailQueries.map((query) => query.refetch()))}
            />
          )}

          {selectedDetails.length > 0 && (
            <div className="overflow-x-auto rounded-xl border border-slate-800">
              <table className="w-full min-w-[700px] border-collapse text-left">
                <thead className="bg-slate-800">
                  <tr>
                    <th scope="col" className="w-44 p-4 text-sm font-semibold text-slate-300">Record field</th>
                    {selectedDetails.map((experiment) => (
                      <th key={experiment.id} scope="col" className="min-w-[240px] p-4 align-top">
                        <span className="block text-white">{experiment.title}</span>
                        {experiment.acronym && <span className="mt-1 block text-sm text-amber-300">{experiment.acronym}</span>}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800">
                  <tr>
                    <th scope="row" className="p-4 text-sm font-medium text-slate-300">Program / mission</th>
                    {selectedDetails.map((experiment) => (
                      <td key={experiment.id} className="p-4 text-sm text-slate-400">
                        <p>Program: {experiment.program ?? "Not provided"}</p>
                        <p className="mt-1">Mission: {experiment.mission ?? "Not provided"}</p>
                      </td>
                    ))}
                  </tr>
                  <tr>
                    <th scope="row" className="p-4 text-sm font-medium text-slate-300">Objectives</th>
                    {selectedDetails.map((experiment) => (
                      <td key={experiment.id} className="p-4 align-top">
                        <SectionCell
                          sections={sectionsOfType(experiment, "objectives")}
                          emptyText="No objectives section is stored."
                        />
                      </td>
                    ))}
                  </tr>
                  <tr>
                    <th scope="row" className="p-4 text-sm font-medium text-slate-300">Methodology</th>
                    {selectedDetails.map((experiment) => (
                      <td key={experiment.id} className="p-4 align-top">
                        <SectionCell
                          sections={sectionsOfType(experiment, "methodology")}
                          emptyText="No methodology section is stored."
                        />
                      </td>
                    ))}
                  </tr>
                  <tr>
                    <th scope="row" className="p-4 text-sm font-medium text-slate-300">Verified findings</th>
                    {selectedDetails.map((experiment) => (
                      <td key={experiment.id} className="p-4 align-top">
                        <FindingsCell experiment={experiment} />
                      </td>
                    ))}
                  </tr>
                  <tr>
                    <th scope="row" className="p-4 text-sm font-medium text-slate-300">Publications and sources</th>
                    {selectedDetails.map((experiment) => (
                      <td key={experiment.id} className="p-4 align-top">
                        <EvidenceList experiment={experiment} />
                      </td>
                    ))}
                  </tr>
                  <tr>
                    <th scope="row" className="p-4 text-sm font-medium text-slate-300">Stored metrics</th>
                    {selectedDetails.map((experiment) => (
                      <td key={experiment.id} className="p-4 align-top">
                        <MetricsCell experiment={experiment} />
                      </td>
                    ))}
                  </tr>
                </tbody>
              </table>
            </div>
          )}
        </>
      )}
    </div>
  );
}
