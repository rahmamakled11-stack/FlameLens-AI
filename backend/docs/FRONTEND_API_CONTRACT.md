# FlameLens AI Frontend API Contract

**Status:** Proposed contract for review; no business endpoints are implemented by this document.  
**Base path:** `/api/v1`  
**Evidence reviewed:** the runnable frontend scaffold, all three incoming submissions and the available extracted task-2 files, Laravel models and migrations, backend architecture documentation, the NASA catalog import report, and the verified catalog manifest.

## 1. Audit findings and contract status

### Frontend actually present

The runnable frontend in `frontend/src` is currently a scaffold. The only FlameLens feature UI source found is under `frontend/incoming/task-1`; it has a `BrowserRouter`, React Query and Axios, and routes for `/`, `/experiments`, and `/experiments/:id`. The detail route is a placeholder. Neither `backend/docs/FRONTEND_AUDIT.md` nor a frontend `docs/FRONTEND_AUDIT.md` exists.

The `incoming/task-1` code currently includes:

- **Dashboard:** summary cards (`Research Papers`, `Experiments`, `Research Areas`, `Data Sources`), a monthly research activity chart with `papers` and `experiments` series, and three “Featured Investigations”.
- **Experiment Explorer:** 350 ms search debounce, hard-coded category filters, data-availability filter, nine cards per page, previous/next pagination, and retry/empty/loading UI.
- **Experiment Details:** placeholder text only; no details component or data hook.
- **Comparison:** no page, route, component, or request found.
- **AI Research Assistant:** a navigation link and dashboard link point to `/assistant`, but no page or API call exists.
- **Evidence Viewer:** no page, route, component, or API call found.

The student UI's `lib/api.ts` currently uses a base URL defaulting to `/api` and requests `/stats`, `/activity`, `/experiments/featured`, and `/experiments`. Its `/api` prefix does not match the backend's versioned `/api/v1` route prefix. Its experiment type calls `id` a “NASA Experiment ID”, although database `id` is a FlameLens row key and `nasa_identifier` is separately nullable. It also expects `category`, `keywords`, `dataAvailability`, `startDate`, and `institution`, which do not exist as normalized columns in the current schema. Its stats card displays `0` when a field is missing; missing or unverified values must instead remain null/unknown in the UI. The explorer attempts to debounce search with `useMemo`, but the returned cleanup function is not registered as an effect cleanup; actual request timing should be corrected/confirmed in a separate frontend change.

The declared frontend types expect `Experiment { id, name, category, description, dataAvailability, keywords, startDate?, institution? }`, `Stats { researchPapers, experiments, researchAreas, dataSources }`, and `ActivityPoint { month, papers, experiments }`. The API client expects a raw `Stats` object, an `ActivityPoint[]`, a featured `Experiment[]`, and an explorer response shaped as `{ data: Experiment[], total, page }`; it does not currently unwrap the proposed standard success envelope. No mock experiment or metric payloads were found; the dashboard/explorer data is fetched through the four calls above. These type/response mismatches require a separately approved client adaptation, not backend fields inferred from the UI.

The UI was inspected in place only; no frontend files were modified.

### Complete submission audit

| Submission/location | Files and content inspected | Finding |
|---|---|---|
| `frontend/src` | `app/App.tsx`, `app/providers/AppProviders.tsx`, `main.tsx` | Runnable React/Vite shell only; no domain pages, API client, or data types. |
| `frontend/incoming/task-1` | `App.tsx`; layout `Navbar` and `Sidebar`; `DashboardPage` and its `StatsCards`, `ResearchActivityChart`, and `FeaturedExperiments`; `ExperimentExplorerPage` and its `ExperimentSearch`, `ExperimentFilters`, `ExperimentGrid`, and `ExperimentCard`; `hooks/useExperiments.ts`, `lib/api.ts`, and `types/experiment.ts` | The sole FlameLens UI submission. Routes and currently called unversioned endpoints are described above. No implemented detail, comparison, assistant, or evidence page. |
| `frontend/incoming/task-2` | Full directory inventory, including `FlameLens AI Project Overview - Kimi_files` and its three `f*.txt` files | Asset-only capture; no submitted HTML application, React/TypeScript source, route, typed model, or API call was present to inspect. The capture is not evidence of additional product UI requirements. |
| `frontend/incoming/task-3/secureai_site` | `index.html`, `script.js`, `server.py`, and `README.md` | Separate SecureAI cybersecurity prototype (including its security-advice `/api/ask` flow), not FlameLens combustion research; excluded from FlameLens contract requirements. |
| Other frontend source | Source/route search outside dependencies and generated output | No additional FlameLens page implementation or extracted student UI source found. |

Across all available submissions, the six requested areas resolve as follows: Dashboard and Explorer are implemented only in task-1; Details is a placeholder route; Comparison and Evidence Viewer are absent; the Research Assistant is a navigation link to an unimplemented route. The confirmed task-1 API calls are `/stats`, `/activity`, `/experiments/featured`, and `/experiments` relative to a base URL defaulting to `/api`; none are versioned `/api/v1`. These are current frontend calls, not approved backend contracts.

### Backend state

The current backend includes `GET /api/v1/status` only; no business API endpoints or response resources exist yet. The available domain entities are experiments, sources, publications, media, experiment sections, and experiment metrics. `catalog_key` is internal ingestion identity and must not be exposed as a NASA identifier.

A read-only database count found 8 experiments, 26 sources, 15 sections, 13 publications, 5 media records, and 0 metrics. The import report has been reconciled to preserve the original dry-run and test history while recording the subsequent committed import and these verified live counts.

## 2. Contract conventions

All success bodies use this envelope:

```json
{
  "data": {},
  "meta": {}
}
```

`meta` is omitted when it adds no information. Collection responses always include pagination metadata. JSON names are `snake_case`; frontend clients should map to TypeScript names if desired. Database row IDs in responses are decimal strings, not NASA identifiers. `nasa_identifier` is explicitly separate and may be `null`. `catalog_key` and importer tracking metadata are never serialized.

Dates use ISO 8601: date-only fields use `YYYY-MM-DD`; timestamps use UTC RFC 3339, for example `2026-11-15T16:30:00Z`. Numeric scientific metrics are decimal strings (matching Laravel's decimal cast) or `null`. Never coerce null values to zero.

### Error envelope

All API errors use:

```json
{
  "error": {
    "code": "VALIDATION_FAILED",
    "message": "The request is invalid.",
    "details": {
      "per_page": ["The per_page field must not be greater than 100."]
    },
    "request_id": "request-correlation-id"
  }
}
```

`details` is `{}` when there are no field-specific details. A request ID is generated by the API/middleware and is not an experiment or NASA identifier.

| HTTP | Use |
|---|---|
| `400` | Malformed request or invalid JSON body. |
| `404` | Experiment or requested resource does not exist. |
| `413` | Request body exceeds the configured request limit. |
| `422` | Valid JSON but invalid parameters or domain input. |
| `429` | Rate limit exceeded. Include `Retry-After` when applicable. |
| `500` | Unexpected server failure; return a generic message, log correlation ID server-side, do not include stack traces or credentials. |
| `503` | A required service is unavailable, e.g. a future AI provider. Do not return an invented or fallback answer as success. |

Unauthenticated public read routes do not need auth errors. Any future account-specific assistant history or saved comparisons require an approved authentication contract first.

## 3. Frontend-to-endpoint mapping

“Proposed” endpoints below are contract recommendations, not implemented routes.

| Frontend page/component | Required data and current UI state | Proposed endpoint(s) | Current model mapping / readiness |
|---|---|---|---|
| Dashboard — `StatsCards` | Four count cards; skeleton while loading; generic retry guidance on error. No empty state; currently defaults missing values to zero. | `GET /dashboard/summary` | Publications, experiments, and sources are countable. “Research areas” has no defined taxonomy/column and must be `null` or withheld until defined. |
| Dashboard — `ResearchActivityChart` | Monthly points with papers and experiments series; loading and error states; no explicit empty-state component. | Candidate: `GET /dashboard/activity?interval=month&from=...&to=...` | `publication_date` exists, but experiment activity dates do not. `created_at` is import/row creation time, not experiment activity. Do not chart or infer experimental activity until date semantics and empty-state behavior are approved. |
| Dashboard — `FeaturedExperiments` | Three featured cards with name, description, data available/unavailable status; loading and error. No empty-state branch. | Candidate: `GET /dashboard/featured-experiments?limit=3` | No featured/curation field or reliable “data availability” field exists. Do not select arbitrary first records, infer availability from media/publications, or report a fabricated curated order. Block until curation and availability policy is agreed. |
| Explorer — search/filter/grid | Search by name/keyword; hard-coded categories; availability; page size 9; page navigation; loading, retryable error, and no-results states. Current hook sends `q`, `category`, `availability`, `page`, and `pageSize`. | `GET /experiments?q=&program=&mission=&page=1&per_page=9&sort=title&direction=asc` | Search can use verified title/acronym/summary/description and optionally sections. There is no `keywords`, normalized `category`, or availability field. The client must map `pageSize` to `per_page` and remove unsupported filters until a taxonomy/policy is approved. |
| Experiment Details | Only placeholder route `/experiments/:id`; actual fields/sections and layout are not specified. | `GET /experiments/{id}` | `Experiment` with sources, publications, media, sections, and metrics. Contract below proposes a source-linked detail representation. |
| Comparison | No frontend page or interaction defined. | `POST /experiments/compare` | Metrics exist but there are no comparison-equivalence rules. A comparison endpoint must label candidates as unassessed/not comparable unless reviewed rules establish compatibility. |
| AI Research Assistant | Sidebar/dashboard links only; no page, prompts, conversation state, or error/streaming behavior. | Candidate: `POST /research/assistant/answers` | No assistant model/provider, conversation storage, or provenance enforcement exists. Must be designed and approved before implementation. |
| Evidence Viewer | No frontend page or expected evidence interaction defined. | `GET /experiments/{id}/evidence` | Can aggregate source records, publications, media, and source-backed sections. There is no standalone evidence model or permission/access-status column. |

## 4. Endpoint specifications

### 4.1 Existing health route

`GET /api/v1/status` is the only current endpoint. It currently returns:

```json
{"status":"ok"}
```

This legacy health response remains unchanged by the proposed business contract. It does not use the success envelope so existing status behavior is preserved.

### 4.2 Dashboard summary

**Proposed:** `GET /api/v1/dashboard/summary`  
**Query/body:** none.

Count only persisted records exposed by the public catalog:

- `research_papers`: count of associated `publications`.
- `experiments`: count of `experiments`.
- `data_sources`: count of `sources`.
- `research_areas`: `null` until the product defines what counts as an area and maps verified records to that taxonomy. Do not substitute acronym, keyword, or program count without approval.

Example response (shape only; placeholder values are not live counts):

```json
{
  "data": {
    "research_papers": 0,
    "experiments": 0,
    "research_areas": null,
    "data_sources": 0
  },
  "meta": {
    "generated_at": "2026-11-15T16:30:00Z"
  }
}
```

In an actual response, `0` is valid only when the corresponding database count is actually zero. `research_areas: null` means undefined/unavailable, not zero. The dashboard component must render unknown explicitly rather than substitute zero.

**Loading/empty/error:** loading is client-side. A zero count is a real empty result; an unavailable/undefined statistic is null with accessible “Not defined” UI. Network/server errors use the shared error envelope and the current retry/error affordance.

### 4.3 Dashboard activity and featured cards (blocked contract items)

The candidate activity request is:

`GET /api/v1/dashboard/activity?interval=month&from=YYYY-MM-DD&to=YYYY-MM-DD`

Candidate shape:

```json
{
  "data": [],
  "meta": {
    "interval": "month",
    "from": null,
    "to": null,
    "availability": "not_configured"
  }
}
```

This endpoint is **not ready for implementation**. The UI chart wants a `papers` and an `experiments` series by month. Publications have a publication date; experiments have no event/start date. Grouping by `created_at` would chart import timing as research activity. The owner must define the date source and whether papers count by publication date and experiments by launch, operation, or publication date. Until then, render the chart as unavailable/empty and do not invent points.

The candidate featured request is:

`GET /api/v1/dashboard/featured-experiments?limit=3`

This endpoint is also **blocked** until a curated/featured selection rule and data-availability meaning exist. A `limit` alone does not make the first three records “featured”. A future item should use the experiment object below plus an explicit curated ordering; availability must be a reviewed evidence/access state, not inferred from linked assets.

### 4.4 Experiment Explorer list

**Proposed:** `GET /api/v1/experiments`

| Query parameter | Type | Rule |
|---|---|---|
| `q` | string | Optional, trimmed, 1–200 characters. Search title, acronym, summary, description; section text may be included only if query performance is acceptable. No unverified external keyword lookup. |
| `program` | string | Optional exact or documented partial match to the stored `program` field. |
| `mission` | string | Optional exact or documented partial match to stored `mission`. |
| `availability` | enum | **Deferred:** there is no stored availability classification. Do not accept the frontend's available/unavailable filter until policy and source field are defined. |
| `page` | integer | Default `1`; minimum `1`. |
| `per_page` | integer | Default `9` to match current UI; minimum `1`, maximum `100`. |
| `sort` | enum | Initially `title` only. Do not sort by `created_at` as if it represented experimental chronology. |
| `direction` | enum | `asc` or `desc`; default `asc`. |

The list response is paginated:

```json
{
  "data": [
    {
      "id": "123",
      "title": "<NASA-verified title>",
      "acronym": null,
      "nasa_identifier": null,
      "program": null,
      "mission": null,
      "summary": null,
      "description": null,
      "nasa_url": null,
      "sources": [
        {
          "id": "<source id>",
          "title": "<stored source title>",
          "source_type": "<stored source type>",
          "source_url": "<original source URL>"
        }
      ],
      "source_count": 0,
      "publication_count": 0,
      "media_count": 0,
      "metric_count": 0
    }
  ],
  "links": {
    "first": "<absolute-or-relative-page-1-url>",
    "last": "<absolute-or-relative-last-page-url>",
    "prev": null,
    "next": null
  },
  "meta": {
    "current_page": 1,
    "from": 1,
    "last_page": 1,
    "per_page": 9,
    "to": 1,
    "total": 1
  }
}
```

The example's values are structural placeholders, not assertions about a NASA record or the current database. An empty result returns `"data": []`, `from`/`to` as `null`, and `total: 0`; never fabricate a card or fill a missing scientific value with zero. Count fields are database relationship counts, not data availability.

**Filter/UI decisions:** the current categories `Combustion`, `Flame Spread`, `Fire Safety`, `Propellant`, and `Soot Formation` are hard-coded, not supported as a taxonomy by the schema. `category` cannot safely be mapped to `program` without approval. Use facets returned from a curated controlled vocabulary or remove/replace those UI filters. Data-availability values similarly need a definition distinguishing accessible dataset, restricted data, no linked dataset, and unknown. “No media” or “no publications” does not prove “data unavailable”.

**Loading/empty/error:** React Query owns loading; return an empty paginated collection for no matches. Keep prior page data during a page transition if desired. Invalid page/per_page/filter returns `422`; no-result query returns `200` with empty `data`.

### 4.5 Experiment detail

**Proposed:** `GET /api/v1/experiments/{id}`  
`{id}` is the database experiment row ID (decimal string), not `nasa_identifier` and not `catalog_key`. A numeric route miss returns `404 RESOURCE_NOT_FOUND`. Do not expose catalog keys or internal importer marker values.

```json
{
  "data": {
    "id": "<database experiment id>",
    "title": "<NASA-verified title>",
    "acronym": null,
    "nasa_identifier": null,
    "program": null,
    "mission": null,
    "summary": null,
    "description": null,
    "nasa_url": null,
    "sections": [
      {
        "id": "<section id>",
        "section_type": "<stored section type>",
        "title": "<source-backed section title>",
        "content": null,
        "display_order": 0,
        "source": {
          "id": "<source id>",
          "title": "<source title>",
          "source_type": "<source type>",
          "source_url": "<original source URL>",
          "publisher": null,
          "publication_date": null,
          "accessed_at": null
        }
      }
    ],
    "sources": [],
    "publications": [],
    "media": [],
    "metrics": []
  }
}
```

Response arrays are empty when there are no related rows. A null section/source relationship is represented as `"source": null`. Publications include `authors: string[] | null`, `publication_type`, `journal`, `doi`, `publication_url`, `publication_date`, and `abstract`; never derive DOI from a title. Media includes `media_type`, `media_url`, `thumbnail_url`, nullable description, and its source object. Metrics include `metric_name`, `metric_value` as `string | null`, `unit`, `conditions` as object/array or null, and source. No metric is emitted merely because the UI requests comparison.

Sources are nested or joined by actual `source_id` only. For a publication with no source FK, its `publication_url` is provenance; do not claim a relational source link that the database does not store. Do not serialize arbitrary `experiments.metadata` because it may contain private importer state.

**Loading/empty/error:** show loading and retry states client-side. Missing experiment is `404`; an experiment whose sections/publications/media/metrics are absent still returns `200` with empty arrays and null fields.

### 4.6 Evidence Viewer

**Proposed:** `GET /api/v1/experiments/{id}/evidence`

| Query parameter | Type | Rule |
|---|---|---|
| `type` | enum | Optional comma-separated set: `source`, `publication`, `media`, `section`; reject unknown types with `422`. |
| `page` | integer | Default `1`, minimum `1`. |
| `per_page` | integer | Default `20`, maximum `100`. |

Return a single evidence list with a type discriminator and stable origin. Preserve original URLs; the API does not proxy or bypass NASA access restrictions.

```json
{
  "data": [
    {
      "evidence_type": "source",
      "id": "<source id>",
      "title": "<source title>",
      "url": "<original source URL>",
      "description": null,
      "date": null,
      "experiment_id": "<database experiment id>",
      "source": {
        "id": "<source id>",
        "title": "<source title>",
        "source_type": "<source type>",
        "source_url": "<original source URL>",
        "publisher": null,
        "publication_date": null,
        "accessed_at": null
      }
    }
  ],
  "links": {
    "first": "<page-1-url>",
    "last": "<last-page-url>",
    "prev": null,
    "next": null
  },
  "meta": {
    "current_page": 1,
    "from": 1,
    "last_page": 1,
    "per_page": 20,
    "to": 1,
    "total": 1
  }
}
```

For `publication` items, `url` is `publication_url`; date is `publication_date`. For media, `url` is `media_url`, and a separate `thumbnail_url` may be included. For section evidence, `url` is the linked source URL (or null if the relationship is absent); include the section content exactly as stored and do not claim it is independently verified without its source link. Source metadata does not currently have a normalized rights/access status field; do not show “download available” or “public data” from URL presence alone.

No evidence rows is `200` with an empty paginated collection. This endpoint remains proposed because no evidence-page UI was found.

### 4.7 Experiment Comparison

**Proposed:** `POST /api/v1/experiments/compare`  
**Content-Type:** `application/json`.

Request:

```json
{
  "experiment_ids": ["<database experiment id>", "<database experiment id>"],
  "metric_names": []
}
```

Rules: `experiment_ids` must be distinct, contain 2–6 IDs, and all IDs must exist. `metric_names` is optional, unique, and limited to 30 non-empty strings. Unknown IDs return `404` with details; malformed or duplicate IDs return `422`. The 2–6 and 30 limits are proposed guardrails for approval, not frontend-derived requirements.

Response shape:

```json
{
  "data": {
    "experiments": [
      {
        "id": "<database experiment id>",
        "title": "<NASA-verified title>",
        "acronym": null,
        "nasa_identifier": null
      }
    ],
    "metric_groups": [
      {
        "metric_name": "<stored metric name>",
        "unit": null,
        "comparison_status": "not_assessed",
        "reason": "Metric semantics or experimental-condition compatibility has not been established.",
        "values": [
          {
            "experiment_id": "<database experiment id>",
            "value": null,
            "conditions": null,
            "source": null
          }
        ]
      }
    ]
  }
}
```

This is a contract shape, not a result claim. A group may be marked `comparable` only when an approved domain rule confirms equivalent metric meaning, compatible units, and compatible experimental conditions. Same text label or same unit alone is insufficient. Otherwise use `not_comparable` or `not_assessed`, with an explanation. Missing metric values are `null`; do not fill absent measurements with `0`. If no metrics are present, return `"metric_groups": []`. The current catalog has zero metric rows, so a first implementation must not produce scientific comparisons from these records.

The metric schema has no canonical metric registry, conversion policy, controlled condition ontology, or rules linking different spellings to the same physical quantity. This endpoint needs a science/domain review before implementation and has no current frontend UI.

### 4.8 AI Research Assistant

**Candidate only; blocked from implementation pending product/security/data review:** `POST /api/v1/research/assistant/answers`.

Proposed request:

```json
{
  "question": "<user question>",
  "experiment_ids": [],
  "source_ids": []
}
```

Proposed response:

```json
{
  "data": {
    "answer": "<answer grounded only in supplied or retrieved FlameLens sources>",
    "claims": [
      {
        "text": "<individual factual claim>",
        "citations": [
          {
            "source_id": "<database source id>",
            "title": "<stored NASA source title>",
            "url": "<stored original source URL>",
            "experiment_id": "<database experiment id or null>"
          }
        ]
      }
    ],
    "abstained": false
  }
}
```

Every factual claim must cite one or more actual persisted sources. If no adequate source is available, the assistant must explicitly abstain (`abstained: true`) and explain the evidence gap; it must not fabricate a NASA identifier, finding, measurement, or citation. Citation URLs must be taken from stored verified provenance, never invented by the model. The response must separate source text from generated synthesis and should expose retrieval references used for audit. No uncited fallback answer should be returned as success.

The repository has no assistant page, endpoint, conversation/message tables, provider selection, authentication/authorization decision, rate/size policy, prompt-injection policy for retrieved documents, streaming behavior, or retention policy. These decisions are prerequisites; the shape above is a proposal, not an approved interface.

## 5. Database field and provenance mapping

| Database field/model | API field / behavior | Notes |
|---|---|---|
| `experiments.id` | `id` | Internal row identity as string. Use for route and relationship references. Never label it “NASA ID”. |
| `experiments.catalog_key` | Not public | Import idempotency key only. |
| `experiments.nasa_identifier` | `nasa_identifier: string \| null` | Only an explicitly verified NASA investigation identifier. Current catalog entries retain null. |
| `title`, `acronym`, `program`, `mission`, `summary`, `description`, `nasa_url` | same snake_case fields | Nullable values remain JSON null. |
| `experiments.metadata` | Not serialized by default | May contain importer bookkeeping; allowlist any future public metadata fields explicitly. |
| `sources` | `sources[]` / nested `source` | Preserve title, type, original URL, publisher, publication date, accessed timestamp. Do not drop the source URL in projections. |
| `experiment_sections` | `sections[]` / evidence section | Include order and linked source when present. Source FK is nullable. |
| `publications` | `publications[]` | Authors nullable JSON list; publication URL and DOI remain separate nullable fields. Schema has no `source_id` relation. |
| `media` | `media[]` / evidence media | Preserve media URL, thumbnail URL, description, media type, and nullable source relation. |
| `experiment_metrics` | `metrics[]` / comparison groups | `metric_value` string or null, unit and conditions retained, source relation included. No metrics are currently imported. |
| Laravel timestamps | Omitted by default | `created_at` indicates catalog row creation/import time, not mission or experiment activity. |

All detail/list/evidence projections must include provenance where the relationship exists. Experiment-level `summary` and `description` have no field-level source foreign key, so listing associated sources provides record-level provenance only; it must not be presented as precise attribution for each field. Publications likewise have no `source_id`; preserve their own verified `publication_url` instead of implying a database source relation. Never serialize Eloquent models wholesale; use explicit API resources to prevent accidental exposure of `catalog_key`, importer metadata, or new internal fields.

## 6. Validation and operational behavior

- Parse only JSON request bodies for comparison and future assistant requests. Reject malformed bodies with `400`.
- Validate all query parameters and reject unknown enum values with the shared `422` error structure; do not silently ignore unsupported category or availability filters.
- Use eager-loaded relationships and explicit resource projections to avoid N+1 queries and repeated data. Use the same pagination envelope for every list.
- Keep original source URLs unchanged. Do not create URLs from NASA IDs, acronym, title, or guessed paths.
- Preserve record distinctions present in the verified catalog: SAME and SAME-2 remain separately identified/scoped, BASS-II retains its phase label, DAFT remains separate from SAME, and Saffire installment labels remain identifiable. Do not infer completion for SPICE or turn planned objectives into findings.
- Do not use the frontend's display fallback of `0` for missing API fields. Use null/unknown state.
- Do not report `data_availability` based on whether media or publications exist. A record without a dataset link has unknown data availability unless a vetted source explicitly says otherwise.
- Log server exceptions with a request correlation ID; never return stack traces, SQL, credentials, or raw provider errors to the browser.
- No request should trigger NASA web discovery, undocumented NASA API calls, restricted file access, or unbounded external downloads. This is a read API over already reviewed local records.
- AI provider calls, if later approved, need their own timeout, rate limit, request-size cap, safe failure semantics, and auditable source retrieval. A timeout/provider error returns a structured error, not a fabricated answer.

## 7. Unresolved decisions before endpoint implementation

1. **Frontend source-of-truth:** decide whether `frontend/incoming/task-1` is the canonical student UI or a reference submission; the runnable `frontend/src` remains a scaffold.
2. **Dashboard activity:** define “experiment activity” and its trustworthy event date. The current schema contains no mission/experiment date.
3. **Featured selection:** define curator workflow/order; no field currently marks featured records.
4. **Research areas/categories:** define taxonomy and mappings. Existing `program` is not interchangeable with UI categories without review.
5. **Data availability:** define whether “available” means a public downloadable dataset, published result, accessible media, or something else; add/store access state only after that policy is clear.
6. **Experiment details and evidence UX:** agree required tabs, source display, citations, external link behavior, and whether evidence list pagination is needed.
7. **Comparison science rules:** define metric canonicalization, unit conversion policy, condition compatibility, sources needed, and presentation for not-comparable values. Current metric table is empty.
8. **AI assistant:** choose provider/runtime, whether conversation state is needed, auth, privacy/retention, retrieval scope, citation validation, rate limits, streaming/error behavior, and security review.
9. **Client adaptation:** align the frontend Axios base path with `/api/v1`, replace UI-specific data fields with supported vocabulary, handle nulls, and define navigation/page requirements for unimplemented screens.

## 8. Endpoint implementation readiness

This table evaluates safe backend implementation against the inspected code and current schema. It does not authorize implementation; business endpoints remain unimplemented pending the requested approval.

| Priority | Endpoint | Readiness | Limits and frontend implications |
|---:|---|---|---|
| 1 | `GET /api/v1/experiments` | **Ready now within the documented contract.** | Implement `q`, `program`, `mission`, `page`, `per_page`, `sort=title`, and `direction` only. Return internal row IDs as strings, nullable scientific fields, counts, and associated source summaries with original URLs. Do not accept the UI's category or availability filters; those fields/policies do not exist. The client must align its filters and `/api/v1` base path separately. |
| 2 | `GET /api/v1/experiments/{id}` | **Ready now within the documented contract.** | Use the internal database row ID, explicit resources, empty relationship arrays, nullable values, and source URLs for actual source relationships. Never serialize `catalog_key` or importer metadata. The details UI is still a placeholder, so the client must adopt the approved shape. |
| 3 | `GET /api/v1/dashboard/summary` | **Ready now with an explicit unknown.** | Count persisted publications, experiments, and sources; return `research_areas: null` until a taxonomy is approved. The current card component converts null/missing values to zero, so it must later render “Not defined” rather than a false zero. |
| Later | Dashboard activity / featured experiments | **Blocked.** | No trustworthy experiment activity date, featured curation, or data-availability policy. |
| Later | Comparison | **Blocked.** | No comparison UI or science-reviewed metric compatibility, unit-conversion, and condition rules; live catalog has zero metrics. |
| Later | AI Research Assistant | **Blocked.** | No FlameLens assistant page or approved provider, security, privacy, citation, or retention decisions. |
| Later | Evidence Viewer | **Proposed, not UI-confirmed.** | No viewer page or interaction contract; detail may already expose linked evidence. Decide whether a separate endpoint is needed. |

The list/detail/summary endpoints are safe to begin implementing against these limits; this review itself makes no endpoint changes.

## 9. Recommended implementation order (after approval)

1. Confirm this contract's envelope, ID representation, null behavior, and frontend source-of-truth.
2. Implement explicit resources and tests for `GET /api/v1/experiments` and `GET /api/v1/experiments/{id}`, including pagination and provenance. Correct the frontend NASA-ID/internal-ID presentation and unsupported filters in a separately approved frontend task.
3. Implement `GET /api/v1/dashboard/summary` using actual counts and nullable `research_areas`; update the UI to render unknown values.
4. Resolve and then implement dashboard curation/activity only if both data semantics and UI empty states are approved.
5. Agree a science-reviewed comparison model before implementing `/experiments/compare`.
6. Design evidence display and implement `/experiments/{id}/evidence` if a distinct list view is still needed beyond detail relations.
7. Treat the AI assistant as a separate project phase after the provider, security, source-grounding, and retention decisions are complete.

No endpoint has been implemented and no frontend, schema, migration, `.env`, package, or database record was changed for this API-contract task.
