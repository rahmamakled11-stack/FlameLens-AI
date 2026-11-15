import { useState, type FormEvent, type ReactNode } from "react";
import { ExternalLink } from "lucide-react";
import { Link } from "react-router-dom";
import { EmptyState } from "@/components/ui/EmptyState";
import { ErrorState } from "@/components/ui/ErrorState";
import { LoadingState } from "@/components/ui/LoadingState";
import { getApiErrorMessage } from "@/api/client";
import type { ExperimentDetails } from "@/features/experiments/types/experiment";
import { getExperimentById, getExperiments } from "@/features/experiments/services/experimentsService";

const STOP_WORDS = new Set([
  "a", "an", "and", "are", "about", "can", "could", "did", "do", "does", "for", "from",
  "how", "in", "is", "it", "me", "of", "on", "or", "please", "show", "tell", "that",
  "the", "their", "this", "to", "was", "were", "what", "when", "where", "which", "who",
  "why", "with", "would", "experiment", "experiments", "research", "nasa",
]);

interface RetrievalResult {
  terms: string[];
  experiments: ExperimentDetails[];
}

function extractSearchTerms(question: string): string[] {
  return [...new Set(
    (question.match(/[a-z0-9-]+/gi) ?? [])
      .map((term) => term.toLowerCase())
      .filter((term) => term.length >= 2 && !STOP_WORDS.has(term)),
  )].slice(0, 3);
}

function OriginalLink({ href, children }: { href: string; children: ReactNode }) {
  return (
    <a
      href={href}
      target="_blank"
      rel="noreferrer"
      className="inline-flex items-center gap-1 break-all text-amber-400 hover:underline"
    >
      {children} <ExternalLink className="h-3.5 w-3.5 shrink-0" aria-hidden="true" />
    </a>
  );
}

export function AssistantPage() {
  const [question, setQuestion] = useState("");
  const [submittedQuestion, setSubmittedQuestion] = useState("");
  const [result, setResult] = useState<RetrievalResult | null>(null);
  const [error, setError] = useState<unknown>(null);
  const [isLoading, setIsLoading] = useState(false);

  const retrieve = async (value: string) => {
    const normalizedQuestion = value.trim();
    if (!normalizedQuestion) return;

    const terms = extractSearchTerms(normalizedQuestion);
    setSubmittedQuestion(normalizedQuestion);
    setResult(null);
    setError(null);
    setIsLoading(true);

    try {
      if (!terms.length) {
        setResult({ terms, experiments: [] });
        return;
      }

      const responses = await Promise.all(
        terms.map((term) =>
          getExperiments({
            search: term,
            program: "",
            mission: "",
            page: 1,
            pageSize: 100,
          }),
        ),
      );
      const scores = new Map<string, { experimentId: string; score: number }>();

      for (const [index, response] of responses.entries()) {
        const term = terms[index];
        for (const experiment of response.data) {
          const titleMatch = `${experiment.title} ${experiment.acronym ?? ""}`.toLowerCase().includes(term);
          const summaryMatch = (experiment.summary ?? "").toLowerCase().includes(term);
          const descriptionMatch = (experiment.description ?? "").toLowerCase().includes(term);
          const score = (titleMatch ? 5 : 0) + (summaryMatch ? 2 : 0) + (descriptionMatch ? 1 : 0);
          const current = scores.get(experiment.id);
          scores.set(experiment.id, {
            experimentId: experiment.id,
            score: (current?.score ?? 0) + score,
          });
        }
      }

      const rankedIds = [...scores.values()]
        .sort((left, right) => right.score - left.score || left.experimentId.localeCompare(right.experimentId))
        .slice(0, 5)
        .map((entry) => entry.experimentId);
      const experiments = await Promise.all(rankedIds.map((id) => getExperimentById(id)));
      setResult({ terms, experiments });
    } catch (retrievalError) {
      setError(retrievalError);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    void retrieve(question);
  };

  return (
    <div className="mx-auto flex max-w-5xl flex-col gap-6 p-6">
      <header>
        <h1 className="text-2xl font-bold text-white">AI Research Assistant</h1>
        <p className="mt-1 text-sm text-slate-400">
          Search the stored NASA experiment catalog and review its linked evidence.
        </p>
      </header>

      <aside className="rounded-lg border border-sky-800/60 bg-sky-950/30 p-4 text-sm text-sky-100" role="note">
        This MVP uses catalog retrieval only. It does not connect to an external AI model or generate scientific conclusions.
        Answers below quote stored catalog fields and identify associated sources.
      </aside>

      <form onSubmit={handleSubmit} className="space-y-3 rounded-xl border border-slate-800 bg-slate-800/50 p-5">
        <label htmlFor="assistant-question" className="block text-sm font-medium text-slate-200">
          Ask a question about the catalog
        </label>
        <textarea
          id="assistant-question"
          value={question}
          onChange={(event) => setQuestion(event.target.value)}
          required
          rows={3}
          maxLength={500}
          placeholder="For example: What objectives are recorded for BASS?"
          className="w-full resize-y rounded-lg border border-slate-700 bg-slate-900 px-3 py-2.5 text-sm text-white placeholder:text-slate-500 focus:border-amber-500"
        />
        <div className="flex items-center justify-between gap-3">
          <p className="text-xs text-slate-500">Searches up to three meaningful terms in stored experiment fields.</p>
          <button
            type="submit"
            disabled={isLoading || !question.trim()}
            className="rounded-lg bg-amber-500 px-4 py-2 text-sm font-semibold text-slate-950 hover:bg-amber-400 disabled:cursor-not-allowed disabled:opacity-50"
          >
            {isLoading ? "Searching…" : "Search catalog"}
          </button>
        </div>
      </form>

      {isLoading && <LoadingState label="Searching experiments and retrieving linked records…" />}

      {error !== null && (
        <ErrorState
          message={getApiErrorMessage(error, "The catalog search could not be completed.")}
          onRetry={() => void retrieve(submittedQuestion)}
        />
      )}

      {result && !result.experiments.length && (
        <section aria-live="polite">
          <EmptyState
            title="The available NASA catalog does not contain enough information to answer reliably"
            description={
              result.terms.length
                ? `No experiment matched the searchable fields for: ${result.terms.join(", ")}.`
                : "Try naming an experiment, acronym, or topic from its title or stored description."
            }
          />
        </section>
      )}

      {result && result.experiments.length > 0 && (
        <section aria-live="polite" className="space-y-4">
          <div className="rounded-lg border border-slate-800 bg-slate-900/60 p-4">
            <h2 className="font-semibold text-white">Catalog retrieval for: “{submittedQuestion}”</h2>
            <p className="mt-1 text-sm text-slate-400">
              Matched stored experiment fields using {result.terms.join(", ")}. The records below are retrieved catalog content,
              not an AI-generated answer or an assessment that every associated source supports every field.
            </p>
          </div>

          {result.experiments.map((experiment: ExperimentDetails) => (
            <article key={experiment.id} className="rounded-xl border border-slate-800 bg-slate-800/50 p-5">
              <h3 className="text-lg font-semibold text-white">
                <Link to={`/experiments/${experiment.id}`} className="hover:text-amber-300 hover:underline">
                  {experiment.title}
                </Link>
              </h3>
              {experiment.acronym && <p className="mt-1 text-sm text-amber-300">{experiment.acronym}</p>}
              {experiment.summary && (
                <div className="mt-4">
                  <h4 className="text-xs font-semibold uppercase tracking-wide text-slate-500">Stored summary</h4>
                  <p className="mt-1 whitespace-pre-line text-sm text-slate-300">{experiment.summary}</p>
                </div>
              )}
              {experiment.description && (
                <div className="mt-3">
                  <h4 className="text-xs font-semibold uppercase tracking-wide text-slate-500">Stored description</h4>
                  <p className="mt-1 whitespace-pre-line text-sm text-slate-400">{experiment.description}</p>
                </div>
              )}

              {experiment.sections.length > 0 && (
                <div className="mt-4 space-y-3">
                  <h4 className="text-xs font-semibold uppercase tracking-wide text-slate-500">Stored sections</h4>
                  {experiment.sections.map((section) => (
                    <div key={section.id} className="rounded-lg border border-slate-700 p-3">
                      <p className="text-xs uppercase tracking-wide text-amber-400">{section.section_type}</p>
                      <h5 className="mt-1 font-medium text-slate-200">{section.title}</h5>
                      {section.content && (
                        <p className="mt-2 whitespace-pre-line text-sm text-slate-400">{section.content}</p>
                      )}
                      {section.source ? (
                        <p className="mt-2 text-xs">
                          <OriginalLink href={section.source.source_url}>
                            Section source: {section.source.title}
                          </OriginalLink>
                        </p>
                      ) : (
                        <p className="mt-2 text-xs text-slate-500">No source relationship is stored for this section.</p>
                      )}
                    </div>
                  ))}
                </div>
              )}

              <div className="mt-4 border-t border-slate-700 pt-4">
                <h4 className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                  Record-associated sources (not field-specific)
                </h4>
                {experiment.sources.length ? (
                  <ul className="mt-2 space-y-2">
                    {experiment.sources.map((source) => (
                      <li key={source.id} className="text-sm">
                        <span className="font-medium text-slate-200">{source.title}</span>
                        <span className="ml-2 text-xs text-slate-500">
                          {[source.publisher, source.source_type, source.publication_date].filter(Boolean).join(" · ")}
                        </span>
                        <span className="mt-1 block">
                          <OriginalLink href={source.source_url}>Open original source</OriginalLink>
                        </span>
                      </li>
                    ))}
                  </ul>
                ) : (
                  <p className="mt-2 text-sm text-slate-500">No sources are linked to this experiment record.</p>
                )}
              </div>

              {experiment.publications.length > 0 && (
                <div className="mt-4">
                  <h4 className="text-xs font-semibold uppercase tracking-wide text-slate-500">Related publications</h4>
                  <ul className="mt-2 space-y-2">
                    {experiment.publications.map((publication) => (
                      <li key={publication.id} className="text-sm text-slate-300">
                        {publication.title}
                        {publication.publication_url && (
                          <span className="ml-2">
                            <OriginalLink href={publication.publication_url}>Open publication</OriginalLink>
                          </span>
                        )}
                      </li>
                    ))}
                  </ul>
                  <p className="mt-2 text-xs text-slate-500">
                    Publications are related records; the catalog does not store a field-level source link for them.
                  </p>
                </div>
              )}
            </article>
          ))}
          {result.experiments.length === 5 && (
            <p className="text-xs text-slate-500">Showing at most five matching experiment records.</p>
          )}
        </section>
      )}
    </div>
  );
}
