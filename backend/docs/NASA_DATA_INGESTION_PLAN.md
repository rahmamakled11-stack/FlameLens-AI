# NASA Data Ingestion Plan

**Status:** Proposed architecture only. No ingestion implementation, schema modification, or data load is authorized by this plan.  
**Basis:** Existing FlameLens AI architecture documented in [BACKEND_DATABASE_ARCHITECTURE.md](./BACKEND_DATABASE_ARCHITECTURE.md) and source findings in [NASA_DATA_SOURCE_AUDIT.md](./NASA_DATA_SOURCE_AUDIT.md).

## 1. Goals and guardrails

- Start with NASA's official PSI records for physical-sciences/combustion investigations; use NASA program, ISS Research Explorer, NTRS, and NASA Images and Video Library pages as corroborating or linked sources.
- Store only fields that a cited NASA record or reviewed NASA-linked primary publication actually supplies. Missing values stay `NULL`; unknown is not zero, “none,” or an inferred result.
- Never infer findings or measurements from experiment names, summaries, plots, thumbnails, search ranking, or unrelated publications.
- Retain exact original URLs, repository identifiers, dates accessed, licensing/distribution indicators, and relevant source metadata.
- Do not scrape a JavaScript interface, call an undocumented internal endpoint, bypass sign-in/access restrictions, or treat a public web page as permission for bulk download. Obtain NASA's supported interface and terms before automation.
- Treat DOI, NASA experiment identifier, PSI record/dataset identifier, station investigation identifier, and NTRS citation number as distinct identifier namespaces.
- No internet calls occur inside database transactions. A source outage must not create partial application data.

## 2. Source-specific adapter boundaries

Implement adapters only after their interface and permitted use have been verified.

| Adapter | Role | Proposed first release |
|---|---|---|
| `PsiRepositoryAdapter` | Preferred discovery of PSI physical-science investigations, related datasets, simulations, and citations. | Start as a reviewed/manual import workflow using official record pages and released downloadable files. Add an automated client only after NASA confirms a supported interface, schema, pagination, and request policy. Do not reverse engineer the current client application. |
| `NasaIssResearchExplorerAdapter` | Corroborate space-station experiment description, objectives, results, imagery, facilities, and publications. | Human-reviewed source links/record manifests first. No crawler or guessed JSON endpoint. |
| `NtrsCitationAdapter` | Discover NASA technical reports and publication metadata; resolve public PDF/text only when distribution and rights permit. | Can be evaluated as an HTTP JSON adapter against the observed citations search response. Confirm a supported API contract, paging, rate limits, and field semantics with NASA before production. An NTRS hit is a citation candidate, not an experiment match. |
| `NasaImagesLibraryAdapter` | Find NASA-hosted media and metadata where assets can be positively linked to an investigation. | Wait for validation against NASA's current official API document and live response, including endpoint, limits, rights, and metadata semantics. No endpoint is specified by this plan. |
| `NasaProgramPageReference` | Preserve NASA BPS, Combustion Science, project, mission, and other HTML pages as provenance. | Add a page as a human-confirmed `Source`; do not parse page HTML as a data feed. |

An adapter should return a typed, source-neutral **candidate record** plus a provenance envelope; it should not write directly to Eloquent models. Example conceptual envelope:

- origin system and record identifier (with namespace);
- canonical record URL and retrieved-from URL;
- retrieval time, source page's publication/modified time if supplied;
- content type, response status, and source version/ETag/checksum when available;
- raw source document or file reference under an approved retention policy;
- parser/schema version and explicit warnings for unresolved identifiers or rights.

This is a design shape, not a proposed NASA endpoint or final code API.

## 3. Normalize and map against current tables

The following mapping is provisional. The provider's native value and original label should be retained when normalizing; absent values remain null. Map `metadata` as a small set of raw **metadata fields**, not a substitute for preserving dataset files or their data dictionary.

| Verified source data | Existing destination | Normalization and validation |
|---|---|---|
| Official experiment/investigation title | `experiments.title` | Required. Preserve spelling and punctuation; do not generate a title from an acronym. |
| NASA-assigned identifier expressly identified as an experiment/investigation identifier | `experiments.nasa_identifier` | Nullable unique value only after confirming namespace and identity. Do not put PSI dataset IDs, NTRS IDs, mission numbers, or DOI values here. |
| Official acronym | `experiments.acronym` | Nullable exact source value. Acronym alone is never a deduplication key. |
| NASA program or discipline | `experiments.program` | Populate only when the source explicitly states it. Keep native label in `metadata` if the canonical program vocabulary is not yet defined. |
| Explicit mission/platform | `experiments.mission` | Preserve exact source label; mission, ISS expedition, experiment campaign, and facility are not assumed equivalent. |
| NASA-provided overview/summary | `experiments.summary` | Summary only; preserve a fuller description separately. Do not rewrite scientific results as summary. |
| NASA-provided detailed description/objectives | `experiments.description` and/or `experiment_sections` | Map a single coherent description to `description`; use typed sections only when the source actually structures content into independently attributable sections. |
| Original NASA experiment landing page | `experiments.nasa_url` | Canonical NASA page URL; keep repository record URLs as separate `sources` as appropriate. |
| Other explicitly named native metadata fields | `experiments.metadata` | Preserve source field names/values, source record ID namespace, and relevant non-normalized context. Never silently coerce arbitrary arrays or prose into normalized columns. |
| NASA original source page, repository record, or approved dataset citation | `sources` | One source record per independently citable page/document/dataset. Set `experiment_id` only after a reviewed, positive match; store exact URL, descriptive title, `source_type`, publisher, publication date, retrieval/access time, and source metadata. |
| Directly sourced objectives, methods, findings, or additional content | `experiment_sections` | One section per source-backed body with `section_type`, title, exact or transparently summarized content, display order, and a linked `source_id`. Record section source and transformation in provenance. Do not make up a section if none is supplied. |
| Publication title, authors, type, journal, DOI, URL, date, abstract | `publications` | Only after confirming the item is a publication and its relation to the experiment. Keep author order and source spelling in JSON. Do not infer a DOI from a title or use an experiment URL as publication URL. |
| NASA image/video asset and supplied caption/thumbnail | `media` | Create only when an official asset and experiment relationship are confirmed. Keep the original media URL, supplied thumbnail/caption, media type, source metadata, and a source link. Do not download/rehost content without rights review. |
| Explicit numerical scalar with label, value, unit, and attributable experimental context | `experiment_metrics` | Insert only if the underlying approved source explicitly supports a scalar value and its unit/conditions. Keep `metric_value` null when absent; preserve experimental conditions in JSON and link `source_id`. Do not extract approximate values from charts in the first ingestion phase. |
| PSI data bundles, file collections, time series, image sequences, simulation outputs, tables, variable definitions, and checksums | **No fitting current table** | Do not put raw files in `media` or turn a data file into one `experiment_metric`. Retain links only as `sources` until a reviewed future dataset/asset model and file-retention policy exist. |

### Current schema limitations and possible future changes

Do not migrate the schema as part of this discovery task. Review these needs against actual NASA record samples before deciding:

1. **External identifiers:** `nasa_identifier` stores one nullable string and cannot distinguish PSI investigation IDs, dataset IDs, ISS Research Explorer IDs, Task Book IDs, and NTRS citation numbers. Consider a namespaced external-identifier/source-record table with a unique `(provider, identifier)` key before broad multi-source synchronization.
2. **Dataset/file products:** PSI records may link to data, simulations, and related outputs, while current `media` is for experiment media and metrics are scalar values. A future dataset/resource table may need provider identifier, record/version, file URL, format, size, checksum, license/access state, variable/data dictionary, and source linkage. Confirm representative public records first.
3. **Publication provenance:** `publications` lacks a `source_id` or publication-source pivot. Until modeled, create and link a `Source` for each publication record where provenance requires it, while avoiding duplicate publications. A proper pivot is preferable if multiple catalogs cite the same paper.
4. **Experiment-publication cardinality:** Publications currently belong to one experiment. A paper may cover several investigations; consider a pivot table if real sourced cases require many-to-many links.
5. **Structured experiment metadata:** Mission/platform, investigators, facilities, dates, discipline, ISS expedition, sample/material, and operational conditions are not first-class fields. Keep source-native values in JSON until a stable cross-record vocabulary is evidenced.
6. **Field-level provenance and versioning:** `source_id` is optional per section/metric/media but there is no general field-level attribution, raw-response history, import run ledger, or stale/deleted upstream record state. An ingestion-run and external-record staging/audit layer is advisable before unattended synchronization.
7. **Metric semantics:** A decimal/name/unit/conditions tuple cannot encode uncertainty, statistical summary type, temporal series, method, or incompatible variable definitions. Do not compare metrics until metadata and a domain-reviewed metric definition establish equivalence.

## 4. Duplicate detection and identity resolution

Use a ranked, reviewable resolution process; do not silently merge based on titles, acronyms, or fuzzy similarity.

1. Match the exact NASA-issued identifier in its confirmed namespace. If the identifier table does not yet exist, first use a controlled provider-to-identifier mapping in the import manifest and require a human-reviewed mapping before persistence.
2. Use a confirmed canonical PSI or other NASA record URL as a provider-specific identity only if the record is explicitly an investigation (not a dataset, paper, or file).
3. Compare normalized title/acronym, program/discipline, mission/platform, and linked authoritative NASA pages as corroborating evidence, not as sole keys.
4. Treat one-to-many cases (campaign/flight, investigation/sub-investigation, dataset/experiment) as distinct entities until NASA's own hierarchy establishes their relation.
5. Resolve publication duplicates by DOI only after DOI validation; otherwise use provider citation ID and human review. Keep a single publication linked to multiple experiments only if an explicit relation is supported.
6. For media/dataset assets, prefer the provider asset ID and canonical URL; do not deduplicate by filename alone.
7. Route conflicting identity evidence to a manual-review queue. Record the competing source values and decision; never overwrite a verified identifier with a guessed one.

## 5. Safe import and re-import lifecycle

### A. Discover and approve

- Maintain a small, version-controlled manifest of official NASA source URLs and their provider/identifier namespaces.
- For each of ACME, BASS, DAFT, FLEX, Saffire, SAME, SLICE, and SPICE, capture the official full title, canonical record URL, stated identifier, discipline, platform, and evidence that it is the intended combustion project.
- Mark candidates as `verified`, `manual_review`, or `not_found_after_documented_search`; never equate a failed request or zero search hits with a NASA-confirmed absence.
- Check distribution, reuse/licensing, repository access terms, and whether automated retrieval is explicitly supported.

### B. Fetch without side effects

- Respect official documented interfaces, pagination, timeouts, current NASA request guidance, and access controls. Use low concurrency and a conservative request interval when limits are not published; stop and escalate on throttling or access-denied responses.
- Use conditional requests only when the selected service documents support for validators such as ETag or Last-Modified.
- Do not fetch URLs supplied by untrusted content without an allowlist and redirect validation. Restrict automated requests to approved official NASA hosts; never follow arbitrary linked hosts automatically.
- Bound response sizes and file types. Treat downloaded documents and JSON as untrusted input; do not execute macros/scripts or embedded content.
- Preserve download URL and retrieval timestamp. Retain raw payloads only where NASA terms, security policy, and storage policy permit; otherwise store a hash and source reference.

### C. Normalize and validate

- Convert only deterministic, documented mappings. Preserve original source text, units, timezone, date precision, and native identifiers in provenance.
- Validate required local fields, URL scheme/host, field lengths, dates, JSON shape, DOI syntax/resolution, enum/vocabulary mapping, and relationship identity.
- Validate all scientific numbers against the source's variable definition, unit, conditions, scale, and stated uncertainty. No implicit unit conversion or imputation.
- Leave unavailable fields `NULL`. Distinguish NASA source text from editor-written summary and label any reviewed summary with its source and method.
- Attach warnings for ambiguity, inconsistent identifiers, changed fields, missing data dictionaries, or access restrictions. Invalid scientific values must be rejected for review, not coerced.

### D. Dry run and review

- Produce a dry-run report with candidate creates/updates/no-ops/conflicts, exact source URLs, field-level before/after differences, and unresolved fields.
- Require human approval for first-time experiment identity, ambiguous acronyms, scientific findings, extracted metrics, cross-source publication links, and any update that changes a verified identifier or source attribution.
- Never let a parser's confidence score alone publish a scientific claim.

### E. Persist transactionally

- The network/file retrieval and parsing occur before database transactions.
- Persist each approved experiment and its related sources/sections/publications/media/metrics in a bounded database transaction. Enforce database unique constraints on verified provider IDs where the schema supports them.
- Keep transactions short. A failed record should roll back its own graph and be reported; it should not silently mark the batch successful. Use a clear batch-level policy: continue with independent records only if each result is auditable.
- Store `accessed_at` at retrieval and preserve the source-provided publication/effective date separately. Do not change timestamps or delete records to simulate source updates.
- Record import-run identity, adapter/parser version, source snapshot/hash, operator/approval, counters, and failure details in durable operational state before unattended recurring imports are introduced.

### F. Idempotent updates and retirement

- Same verified provider identifier plus unchanged normalized content: no-op.
- Same provider identifier plus changed source content: record a diff and source retrieval version; update only approved fields in a transaction. Preserve previous provenance and do not replace higher-quality human-verified content silently.
- A new provider ID with a potentially duplicate title: hold for identity review.
- A record missing from a later search: do not delete, unpublish, or cascade it. Mark the source as not currently observed only after confirming search scope and source semantics; seek explicit NASA withdrawal/retirement evidence.
- Retain a human override/lock for corrected metadata and track why a NASA-reimport did not overwrite it.

## 6. Provenance, observability, and failure handling

- Every stored descriptive section, publication, media item, and metric should point to its closest attributable NASA or NASA-linked `Source` whenever available. Experiment-level `nasa_url` should not be the only provenance record.
- Store canonical source URL separately from request URL and redirect target. Record NASA publisher, source type, source-reported dates, access date/time, provider ID namespace, rights/distribution facts, and source-native field names.
- Preserve method of transformation: exact transcription, deterministic normalization, or reviewed summary. Do not present model-generated or editor-authored text as NASA text.
- Log structured events: provider, batch/run ID, record namespace/ID, request URL (without credentials), response status, duration, parser version, outcome, and sanitized error. Never log API keys, session cookies, signed URLs, or full sensitive payloads.
- Distinguish and alert on: DNS/TLS/timeout, throttling, authentication/access denied, not found, changed schema, malformed document, validation rejection, ambiguous identity, transaction failure, and rights restriction.
- Retry transient network/timeouts with bounded exponential backoff and jitter; do not retry permanent authorization, validation, or rights failures as if successful. Honor any published `Retry-After`.
- Keep per-record status and final counts so an interrupted run can resume safely. Surface partial completion explicitly; never report success-shaped output for skipped or failed records.
- Include metrics such as records discovered/reviewed/imported/updated/no-op/rejected, media links verified, and failures by class. No application request should wait on a long NASA batch.

## 7. Recommended phased rollout

1. **Inventory (manual, no code):** Search PSI using acronym and full title; verify each requested project. Capture evidence and official identifiers. Use Research Explorer, BPS, and source-linked NASA pages for corroboration.
2. **Small reviewed sample:** Select a few confirmed investigations and inspect complete record pages, linked file manifests, citations, terms, and representative data dictionaries. Do not import numerical metrics in this phase.
3. **Publication/media linking:** Validate individual NASA-linked NTRS citations and Images Library records; distinguish relevant result papers/assets from acronym-only matches.
4. **Schema decision:** Use actual samples to decide if an external-identifier registry, dataset/file-resource entity, publication pivot/provenance relation, or import-run audit table is needed.
5. **Dry-run ingestion prototype:** Implement one documented source adapter with an allowlisted host, fixture tests from approved samples, dry-run diffs, and idempotent matching. Do not persist production records or bulk-download until NASA terms/interface and rate policies are confirmed.
6. **Controlled production:** Begin with an operator-triggered, reviewed batch, then consider scheduled incremental updates only if the source provides supported update/paging semantics and NASA usage guidance.

## 8. Go/no-go checklist before implementation

- [ ] NASA confirms the supported PSI discovery/export interface or approves a documented manual-record import.
- [ ] Each archive has a verified full title, source URL, identifier namespace, and positive combustion relationship.
- [ ] Terms, distribution, data reuse, and media permissions are recorded.
- [ ] Representative source record and file schemas have been inspected and mapped.
- [ ] Duplicate resolution handles experiment, dataset, paper, campaign, and media identities separately.
- [ ] Dry-run diff and human review cover first import, ambiguous match, and changed scientific fields.
- [ ] Transactions, partial failures, retries, logs, and restart behavior are tested.
- [ ] Missing values remain missing; metrics have units, conditions, and attributable source.
- [ ] No destructive delete or update is triggered by absence from a later search.

## Recommendation: safest and fastest population path

Begin with a **small, human-verified PSI-first catalog**, not broad web scraping or an assumed NASA API. For each experiment, establish the exact PSI investigation record and source URL, then add only clearly attributable title, identifiers, descriptive sections, source citations, and publication links. Keep uncertain fields null and publish no numeric metrics until a primary dataset and its variable definitions, units, and conditions have been reviewed.

Use the official NTRS JSON search only as a **publication discovery aid** after confirming its integration policy and disambiguating each citation; the live ACME result demonstrates why acronym-only matching is unsafe. Add media from NASA's Images and Video Library only after checking its current API documentation and asset reuse terms. This manual-first, provenance-rich approach is the fastest route to a trustworthy initial dataset while NASA's PSI automation contract and the actual records are being verified.
