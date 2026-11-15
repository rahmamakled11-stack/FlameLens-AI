import { ExternalLink } from "lucide-react";
import { useNavigate, useParams } from "react-router-dom";
import { ErrorState } from "@/components/ui/ErrorState";
import { EmptyState } from "@/components/ui/EmptyState";
import { LoadingState } from "@/components/ui/LoadingState";
import { useExperiments, useExperimentById } from "@/features/experiments/hooks/useExperiments";
import type { ExperimentSource } from "@/features/experiments/types/experiment";
import { getApiErrorMessage } from "@/api/client";

const listParams = { search: "", program: "", mission: "", page: 1, pageSize: 100 };

function SourceLink({ source }: { source: ExperimentSource }) {
  return (
    <a
      href={source.source_url}
      target="_blank"
      rel="noreferrer"
      className="break-all text-amber-400 hover:underline"
    >
      {source.source_url}
      <ExternalLink className="ml-1 inline h-3.5 w-3.5" aria-hidden="true" />
    </a>
  );
}

export function EvidencePage() {
  const { experimentId } = useParams();
  const navigate = useNavigate();
  const experimentsQuery = useExperiments(listParams);
  const detailQuery = useExperimentById(experimentId ?? "");
  const experiment = detailQuery.data;
  const hasEvidence = Boolean(
    experiment &&
      (experiment.sources.length ||
        experiment.publications.length ||
        experiment.sections.length ||
        experiment.media.length),
  );

  return (
    <div className="flex flex-col gap-6 p-6">
      <header>
        <h1 className="text-2xl font-bold text-white">Evidence Viewer</h1>
        <p className="mt-1 text-sm text-slate-400">
          Browse sources and related records stored for an experiment.
        </p>
      </header>

      {experimentsQuery.isLoading ? (
        <LoadingState label="Loading experiments…" />
      ) : experimentsQuery.isError ? (
        <ErrorState
          message={getApiErrorMessage(experimentsQuery.error, "Could not load experiments.")}
          onRetry={() => void experimentsQuery.refetch()}
        />
      ) : experimentsQuery.data?.data.length ? (
        <div className="max-w-2xl">
          <label htmlFor="evidence-experiment" className="mb-2 block text-sm font-medium text-slate-300">
            Select an experiment
          </label>
          <select
            id="evidence-experiment"
            value={experimentId ?? ""}
            onChange={(event) =>
              navigate(event.target.value ? `/evidence/${event.target.value}` : "/evidence")
            }
            className="w-full rounded-lg border border-slate-700 bg-slate-800 px-3 py-2.5 text-sm text-white focus:border-amber-500"
          >
            <option value="">Choose an experiment…</option>
            {experimentsQuery.data.data.map((item) => (
              <option key={item.id} value={item.id}>
                {item.title}
              </option>
            ))}
          </select>
        </div>
      ) : (
        <EmptyState title="No experiments are available" description="There are no records to browse." />
      )}

      {!experimentId && !experimentsQuery.isLoading && !experimentsQuery.isError && (
        <EmptyState
          title="Choose an experiment to view its evidence"
          description="Sources, publications, and related records will appear here."
        />
      )}

      {experimentId && detailQuery.isLoading && <LoadingState label="Loading experiment evidence…" />}

      {experimentId && detailQuery.isError && (
        <ErrorState
          message={getApiErrorMessage(detailQuery.error, "Could not load experiment evidence.")}
          onRetry={() => void detailQuery.refetch()}
        />
      )}

      {experiment && (
        <div className="space-y-6">
          <section className="rounded-xl border border-slate-800 bg-slate-800/60 p-5">
            <p className="text-xs uppercase tracking-wide text-slate-500">Evidence for experiment</p>
            <h2 className="mt-1 text-xl font-semibold text-white">{experiment.title}</h2>
            {experiment.acronym && <p className="mt-1 text-sm text-amber-300">{experiment.acronym}</p>}
          </section>

          {!hasEvidence && (
            <EmptyState
              title="No related evidence is stored"
              description="This record has no linked sources, publications, sections, or media."
            />
          )}

          {experiment.sources.length > 0 && (
            <section aria-labelledby="evidence-sources-heading">
              <h2 id="evidence-sources-heading" className="mb-3 text-lg font-semibold text-white">Sources</h2>
              <div className="grid gap-4 md:grid-cols-2">
                {experiment.sources.map((source) => (
                  <article key={source.id} className="rounded-xl border border-slate-800 bg-slate-800/60 p-5">
                    <h3 className="font-medium text-white">{source.title}</h3>
                    <p className="mt-2 text-sm text-slate-400">
                      {[source.publisher, source.source_type].filter(Boolean).join(" · ") || "Source details unavailable"}
                    </p>
                    {source.publication_date && (
                      <p className="mt-1 text-sm text-slate-500">Publication date: {source.publication_date}</p>
                    )}
                    <p className="mt-3 text-sm"><SourceLink source={source} /></p>
                  </article>
                ))}
              </div>
            </section>
          )}

          {experiment.publications.length > 0 && (
            <section aria-labelledby="evidence-publications-heading">
              <h2 id="evidence-publications-heading" className="mb-3 text-lg font-semibold text-white">Related publications</h2>
              <div className="space-y-3">
                {experiment.publications.map((publication) => (
                  <article key={publication.id} className="rounded-xl border border-slate-800 bg-slate-800/60 p-5">
                    <h3 className="font-medium text-white">{publication.title}</h3>
                    <p className="mt-1 text-sm text-slate-400">
                      {[publication.authors?.join(", "), publication.publication_type, publication.journal, publication.publication_date]
                        .filter(Boolean)
                        .join(" · ") || "Publication details unavailable"}
                    </p>
                    {publication.publication_url ? (
                      <a
                        href={publication.publication_url}
                        target="_blank"
                        rel="noreferrer"
                        className="mt-3 inline-flex break-all text-sm text-amber-400 hover:underline"
                      >
                        Open original publication <ExternalLink className="ml-1 h-3.5 w-3.5" aria-hidden="true" />
                      </a>
                    ) : (
                      <p className="mt-3 text-sm text-slate-500">No publication URL is stored.</p>
                    )}
                  </article>
                ))}
              </div>
              <p className="mt-2 text-xs text-slate-500">
                Publications are related catalog records; no field-level source relationship is stored for them.
              </p>
            </section>
          )}

          {experiment.sections.length > 0 && (
            <section aria-labelledby="evidence-sections-heading">
              <h2 id="evidence-sections-heading" className="mb-3 text-lg font-semibold text-white">
                Related sections
              </h2>
              <div className="space-y-3">
                {experiment.sections.map((section) => (
                  <article key={section.id} className="rounded-xl border border-slate-800 bg-slate-800/60 p-5">
                    <p className="text-xs uppercase tracking-wide text-amber-400">{section.section_type}</p>
                    <h3 className="mt-1 font-medium text-white">{section.title}</h3>
                    <p className="mt-3 whitespace-pre-line text-sm text-slate-300">
                      {section.content ?? "Section content is unavailable in the stored record."}
                    </p>
                    {section.source ? (
                      <div className="mt-3 border-t border-slate-700 pt-3">
                        <p className="mb-1 text-xs text-slate-500">Linked section source</p>
                        <SourceLink source={section.source} />
                      </div>
                    ) : (
                      <p className="mt-3 text-xs text-slate-500">
                        No source is linked to this section; its content is not independently attributed here.
                      </p>
                    )}
                  </article>
                ))}
              </div>
            </section>
          )}

          {experiment.media.length > 0 && (
            <section aria-labelledby="evidence-media-heading">
              <h2 id="evidence-media-heading" className="mb-3 text-lg font-semibold text-white">Related media</h2>
              <div className="grid gap-4 sm:grid-cols-2">
                {experiment.media.map((media) => (
                  <article key={media.id} className="rounded-xl border border-slate-800 bg-slate-800/60 p-5">
                    {media.thumbnail_url && (
                      <img
                        src={media.thumbnail_url}
                        alt={`Thumbnail for ${media.title}`}
                        loading="lazy"
                        className="mb-3 max-h-56 w-full rounded-lg object-contain"
                      />
                    )}
                    <h3 className="font-medium text-white">{media.title}</h3>
                    <p className="mt-1 text-xs text-slate-500">{media.media_type}</p>
                    {media.description && <p className="mt-2 text-sm text-slate-400">{media.description}</p>}
                    <a
                      href={media.media_url}
                      target="_blank"
                      rel="noreferrer"
                      className="mt-3 inline-flex text-sm text-amber-400 hover:underline"
                    >
                      Open original media <ExternalLink className="ml-1 h-3.5 w-3.5" aria-hidden="true" />
                    </a>
                    {media.source && (
                      <div className="mt-3 border-t border-slate-700 pt-3">
                        <p className="mb-1 text-xs text-slate-500">Linked media source</p>
                        <SourceLink source={media.source} />
                      </div>
                    )}
                  </article>
                ))}
              </div>
            </section>
          )}
        </div>
      )}
    </div>
  );
}
