import { Link, useParams } from "react-router-dom";
import { ArrowLeft, ExternalLink } from "lucide-react";
import { useExperimentById } from "@/features/experiments/hooks/useExperiments";
import { LoadingState } from "@/components/ui/LoadingState";
import { ErrorState } from "@/components/ui/ErrorState";
import { getApiErrorMessage } from "@/api/client";
import type { ExperimentMetric, ExperimentSource } from "@/features/experiments/types/experiment";

function SourceLink({ source }: { source: ExperimentSource }) {
  return (
    <a
      href={source.source_url}
      target="_blank"
      rel="noreferrer"
      className="inline-flex items-center gap-1 break-all text-sm text-amber-400 hover:underline"
    >
      {source.source_url}
      <ExternalLink className="h-3.5 w-3.5 shrink-0" aria-hidden="true" />
    </a>
  );
}

function MetricCard({ metric }: { metric: ExperimentMetric }) {
  return (
    <article className="rounded-lg border border-slate-700 bg-slate-900/60 p-4">
      <h3 className="font-medium text-white">{metric.metric_name}</h3>
      <p className="mt-2 text-slate-300">
        {metric.metric_value ?? "Metric value unavailable in stored record"}
        {metric.metric_value !== null && metric.unit ? ` ${metric.unit}` : ""}
      </p>
      {metric.conditions !== null && (
        <div className="mt-3">
          <h4 className="text-xs font-medium uppercase tracking-wide text-slate-500">Recorded conditions</h4>
          <pre className="mt-1 overflow-x-auto whitespace-pre-wrap break-words text-xs text-slate-400">
            {JSON.stringify(metric.conditions, null, 2)}
          </pre>
        </div>
      )}
      {metric.source && (
        <div className="mt-3">
          <p className="mb-1 text-xs text-slate-500">Source</p>
          <SourceLink source={metric.source} />
        </div>
      )}
    </article>
  );
}

export function ExperimentDetailsPage() {
  const { experimentId } = useParams();
  const { data, error, isLoading, isError, refetch } = useExperimentById(experimentId ?? "");

  if (isLoading) return <LoadingState label="Loading experiment details…" />;

  if (isError || !data) {
    return (
      <div className="p-6">
        <ErrorState
          message={getApiErrorMessage(error, "The selected experiment could not be loaded.")}
          onRetry={() => void refetch()}
        />
      </div>
    );
  }

  return (
    <div className="space-y-6 p-6">
      <Link
        to="/experiments"
        className="inline-flex items-center gap-2 text-sm text-amber-400 hover:underline focus-visible:outline focus-visible:outline-2 focus-visible:outline-amber-500"
      >
        <ArrowLeft className="h-4 w-4" /> Back to Explorer
      </Link>
      <section className="rounded-xl border border-slate-800 bg-slate-800/60 p-6">
        <div className="flex flex-wrap gap-2">
          {data.program && (
            <span className="rounded bg-slate-700/60 px-2 py-1 text-xs font-medium text-amber-400">
              Program: {data.program}
            </span>
          )}
          {data.mission && (
            <span className="rounded bg-slate-700/60 px-2 py-1 text-xs font-medium text-slate-300">
              Mission: {data.mission}
            </span>
          )}
        </div>
        <h1 className="mt-4 text-3xl font-bold text-white">{data.title}</h1>
        {data.acronym && <p className="mt-2 text-lg text-amber-300">{data.acronym}</p>}
        {data.nasa_identifier && (
          <p className="mt-3 text-sm text-slate-400">
            NASA identifier: <span className="font-mono text-slate-200">{data.nasa_identifier}</span>
          </p>
        )}
        {data.summary && <p className="mt-5 text-slate-300">{data.summary}</p>}
        {data.description && (
          <p className="mt-3 whitespace-pre-line text-slate-400">{data.description}</p>
        )}
        {!data.summary && !data.description && (
          <p className="mt-5 text-sm text-slate-500">Overview information is unavailable in the stored record.</p>
        )}
        {data.nasa_url && (
          <a
            href={data.nasa_url}
            target="_blank"
            rel="noreferrer"
            className="mt-5 inline-flex items-center gap-1 text-sm text-amber-400 hover:underline"
          >
            NASA record <ExternalLink className="h-4 w-4" aria-hidden="true" />
          </a>
        )}
      </section>

      <section aria-labelledby="experiment-sections-heading">
        <h2 id="experiment-sections-heading" className="mb-3 text-xl font-semibold text-white">Sections</h2>
        {data.sections.length === 0 ? (
          <p className="rounded-xl border border-slate-800 bg-slate-800/40 p-5 text-sm text-slate-400">
            No section information is stored for this record.
          </p>
        ) : (
          <div className="space-y-4">
            {data.sections.map((section) => (
              <article key={section.id} className="rounded-xl border border-slate-800 bg-slate-800/60 p-5">
                <p className="text-xs uppercase tracking-wide text-amber-400">{section.section_type}</p>
                <h3 className="mt-1 text-lg font-semibold text-white">{section.title}</h3>
                <p className="mt-3 whitespace-pre-line text-sm text-slate-300">
                  {section.content ?? "Section content is unavailable in the stored record."}
                </p>
                {section.source && (
                  <div className="mt-4 border-t border-slate-700 pt-3">
                    <p className="mb-1 text-xs text-slate-500">Section source</p>
                    <SourceLink source={section.source} />
                  </div>
                )}
              </article>
            ))}
          </div>
        )}
      </section>

      <section aria-labelledby="experiment-publications-heading">
        <h2 id="experiment-publications-heading" className="mb-3 text-xl font-semibold text-white">Publications</h2>
        {data.publications.length === 0 ? (
          <p className="rounded-xl border border-slate-800 bg-slate-800/40 p-5 text-sm text-slate-400">
            No publications are linked in the stored record.
          </p>
        ) : (
          <div className="space-y-4">
            {data.publications.map((publication) => (
              <article key={publication.id} className="rounded-xl border border-slate-800 bg-slate-800/60 p-5">
                <h3 className="font-semibold text-white">{publication.title}</h3>
                {publication.authors && publication.authors.length > 0 && (
                  <p className="mt-2 text-sm text-slate-400">{publication.authors.join(", ")}</p>
                )}
                <p className="mt-2 text-sm text-slate-500">
                  {[publication.publication_type, publication.journal, publication.publication_date]
                    .filter(Boolean)
                    .join(" · ") || "Publication details unavailable in stored record."}
                </p>
                {publication.doi && <p className="mt-2 text-sm text-slate-400">DOI: {publication.doi}</p>}
                {publication.abstract && (
                  <p className="mt-3 whitespace-pre-line text-sm text-slate-300">{publication.abstract}</p>
                )}
                {publication.publication_url ? (
                  <a
                    href={publication.publication_url}
                    target="_blank"
                    rel="noreferrer"
                    className="mt-4 inline-flex items-center gap-1 break-all text-sm text-amber-400 hover:underline"
                  >
                    {publication.publication_url}
                    <ExternalLink className="h-3.5 w-3.5 shrink-0" aria-hidden="true" />
                  </a>
                ) : (
                  <p className="mt-3 text-sm text-slate-500">Publication URL unavailable in stored record.</p>
                )}
              </article>
            ))}
          </div>
        )}
      </section>

      <section aria-labelledby="experiment-media-heading">
        <h2 id="experiment-media-heading" className="mb-3 text-xl font-semibold text-white">Media</h2>
        {data.media.length === 0 ? (
          <p className="rounded-xl border border-slate-800 bg-slate-800/40 p-5 text-sm text-slate-400">
            No media is linked in the stored record.
          </p>
        ) : (
          <div className="grid gap-4 sm:grid-cols-2">
            {data.media.map((media) => (
              <article key={media.id} className="rounded-xl border border-slate-800 bg-slate-800/60 p-5">
                {media.thumbnail_url && (
                  <img
                    src={media.thumbnail_url}
                    alt={`Thumbnail for ${media.title}`}
                    loading="lazy"
                    className="mb-4 max-h-64 w-full rounded-lg object-contain"
                  />
                )}
                <h3 className="font-semibold text-white">{media.title}</h3>
                <p className="mt-1 text-xs text-slate-500">{media.media_type}</p>
                {media.description && <p className="mt-2 text-sm text-slate-400">{media.description}</p>}
                <a
                  href={media.media_url}
                  target="_blank"
                  rel="noreferrer"
                  className="mt-3 inline-flex items-center gap-1 break-all text-sm text-amber-400 hover:underline"
                >
                  Open media <ExternalLink className="h-3.5 w-3.5 shrink-0" aria-hidden="true" />
                </a>
                {media.source && (
                  <div className="mt-3 border-t border-slate-700 pt-3">
                    <p className="mb-1 text-xs text-slate-500">Media source</p>
                    <SourceLink source={media.source} />
                  </div>
                )}
              </article>
            ))}
          </div>
        )}
      </section>

      {data.metrics.length > 0 && (
        <section aria-labelledby="experiment-metrics-heading">
          <h2 id="experiment-metrics-heading" className="mb-3 text-xl font-semibold text-white">Recorded metrics</h2>
          <div className="grid gap-4 md:grid-cols-2">
            {data.metrics.map((metric) => <MetricCard key={metric.id} metric={metric} />)}
          </div>
        </section>
      )}

      <section aria-labelledby="experiment-sources-heading">
        <h2 id="experiment-sources-heading" className="mb-3 text-xl font-semibold text-white">Sources and provenance</h2>
        {data.sources.length === 0 ? (
          <p className="rounded-xl border border-slate-800 bg-slate-800/40 p-5 text-sm text-slate-400">
            No sources are linked in the stored record.
          </p>
        ) : (
          <div className="grid gap-4 md:grid-cols-2">
            {data.sources.map((source) => (
              <article key={source.id} className="rounded-xl border border-slate-800 bg-slate-800/60 p-5">
                <h3 className="font-medium text-white">{source.title}</h3>
                <p className="mt-1 text-xs text-slate-500">
                  {[source.source_type, source.publisher].filter(Boolean).join(" · ")}
                </p>
                <div className="mt-3"><SourceLink source={source} /></div>
                {source.publication_date && (
                  <p className="mt-2 text-xs text-slate-500">Publication date: {source.publication_date}</p>
                )}
              </article>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
