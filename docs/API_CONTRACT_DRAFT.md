# FlameLens AI — API Contract Draft

Status: Draft for backend discussion only. This document captures the frontend requirements currently implied by the approved React + TypeScript frontend and does not define a final Laravel implementation.

Scope:
- Based on read-only inspection of the current frontend under `frontend/src`.
- Intended to align with the versioned Laravel boundary at `/api/v1`.
- Not a promise that these routes already exist.
- Proposed endpoint names and payloads are draft contract items to be finalized with the Laravel backend developer.

## 1. Frontend data requirements summary

### Dashboard

Required by:
- `frontend/src/features/dashboard/pages/DashboardPage.tsx`
- `frontend/src/features/dashboard/components/StatsCards.tsx`
- `frontend/src/features/dashboard/components/ResearchActivityChart.tsx`
- `frontend/src/features/dashboard/components/FeaturedExperiments.tsx`

Current frontend expectations:
- Summary totals for research papers, experiment count, research areas, and data sources.
- Monthly or period-based activity series for papers and experiment counts.
- A list of featured experiments with enough data for cards and navigation to experiment detail pages.

### Experiment Explorer

Required by:
- `frontend/src/features/experiments/pages/ExperimentExplorerPage.tsx`
- `frontend/src/features/experiments/components/ExperimentSearch.tsx`
- `frontend/src/features/experiments/components/ExperimentFilters.tsx`
- `frontend/src/features/experiments/components/ExperimentGrid.tsx`
- `frontend/src/features/experiments/components/ExperimentCard.tsx`
- `frontend/src/features/experiments/hooks/useExperiments.ts`
- `frontend/src/features/experiments/services/experimentsService.ts`

Current frontend expectations:
- List experiments with search, category filter, data-availability filter, pagination, and per-page sizing.
- Search by name or keyword.
- Optional category grouping.
- Data availability values represented as `available` / `unavailable`.
- Response includes total count and current page metadata.

### Experiment Details

Required by:
- `frontend/src/features/experiments/pages/ExperimentDetailsPage.tsx`
- `frontend/src/features/experiments/hooks/useExperiments.ts`

Current frontend expectations:
- A single experiment resource identified by stable ID.
- Name, description, category, data availability, institution, and NASA-style ID.
- This page is currently minimal; additional fields should be supported without breaking the existing detail layout.

### Comparison

Required by:
- `frontend/src/features/comparison/pages/ComparisonPage.tsx`

Current frontend expectations:
- Future comparison page will need multiple experiments selected for side-by-side comparison.
- A comparison endpoint should support selecting a small set of experiment identifiers.
- Comparable fields should include domain-specific scientific metadata, not only display labels.

### AI Research Assistant

Required by:
- `frontend/src/features/assistant/pages/AssistantPage.tsx`

Current frontend expectations:
- User question submission.
- Structured answer payload.
- Optional references to experiments, evidence, or citations.
- Conversation/session behavior is not yet implemented, so this remains open for backend agreement.

### Evidence Viewer

Required by:
- `frontend/src/features/evidence/pages/EvidencePage.tsx`

Current frontend expectations:
- A single evidence item keyed by route param `evidenceId`.
- Metadata such as title, description, type, source link, related experiment references, and citation fields.
- The frontend is currently placeholder-based and needs the backend contract to define evidence semantics.

---

## 2. Proposed API conventions

### Versioning
- Base path prefix: `/api/v1`
- All proposed routes below are relative to that prefix.

### Response format
Recommended conventions, to be agreed with Laravel developer:
- Success responses should return JSON objects with either `data` or a feature-specific payload under a stable field.
- Errors should return a normalized object with a message and optional validation details.
- Null and optional fields should be explicit and consistent.
- Dates and timestamps should use ISO 8601 strings in UTC when available.

### Pagination
Recommended conventions:
- `page` is 1-based.
- `pageSize` is the requested number of items per page.
- Response includes total count and current page metadata.
- If the backend uses cursor-based pagination, the front-end must agree on the exact structure before implementation.

### Error handling
Proposed standard error contract:
```json
{
  "message": "Validation failed",
  "errors": {
    "field": ["This field is required"]
  },
  "code": "VALIDATION_ERROR"
}
```

### Stable identifiers
- Prefer opaque stable strings for experiment IDs and evidence IDs.
- Prefer explicit resource relationships over derived names.
- Preserve source attribution fields for NASA, publication, or dataset origin.

---

## 3. Proposed endpoints draft

### A. Dashboard

| Priority | Method | Proposed path | Purpose | Notes |
|---|---|---|---|---|
| REQUIRED | GET | `/api/v1/dashboard/stats` | Return summary metrics used by the dashboard stats cards. | Used by `StatsCards`. |
| REQUIRED | GET | `/api/v1/dashboard/activity` | Return chart series by time period for papers and experiments. | Used by `ResearchActivityChart`. |
| REQUIRED | GET | `/api/v1/dashboard/featured` | Return featured experiments for the dashboard. | Used by `FeaturedExperiments`. |

#### GET `/api/v1/dashboard/stats`
Status: REQUIRED

Request:
- No request body.
- Optional query filters are not required for MVP.

Expected response:
```json
{
  "data": {
    "researchPapers": 128,
    "experiments": 42,
    "researchAreas": 9,
    "dataSources": 14
  }
}
```

Frontend consumers:
- `frontend/src/features/dashboard/components/StatsCards.tsx`

#### GET `/api/v1/dashboard/activity`
Status: REQUIRED

Expected response:
```json
{
  "data": [
    { "month": "Jan", "papers": 12, "experiments": 5 },
    { "month": "Feb", "papers": 15, "experiments": 7 }
  ]
}
```

Frontend consumers:
- `frontend/src/features/dashboard/components/ResearchActivityChart.tsx`

#### GET `/api/v1/dashboard/featured`
Status: REQUIRED

Expected response:
```json
{
  "data": [
    {
      "id": "EXP-001",
      "name": "Example Experiment",
      "category": "Combustion",
      "description": "Summary text for card display.",
      "dataAvailability": "available",
      "keywords": ["flame", "microgravity"],
      "startDate": "2024-01-01",
      "institution": "NASA"
    }
  ]
}
```

Frontend consumers:
- `frontend/src/features/dashboard/components/FeaturedExperiments.tsx`

### B. Experiment Explorer and Details

| Priority | Method | Proposed path | Purpose | Notes |
|---|---|---|---|---|
| REQUIRED | GET | `/api/v1/experiments` | Return paginated experiment list with search and filters. | Used by explorer page. |
| REQUIRED | GET | `/api/v1/experiments/{experimentId}` | Return one experiment resource. | Used by detail page. |
| PROPOSED | GET | `/api/v1/experiments/compare` | Return a batch of experiments for comparison. | Optional if comparison page is implemented later. |
| OPTIONAL | GET | `/api/v1/experiments/{experimentId}/related` | Return related experiments or evidence. | Useful but not required for MVP. |

#### GET `/api/v1/experiments`
Status: REQUIRED

Query parameters:
- `q` (string, optional): user search string.
- `category` (string, optional): category filter.
- `availability` (string, optional): `available` or `unavailable`.
- `page` (integer, optional): default 1.
- `pageSize` (integer, optional): default 9.
- `sort` (string, optional): only if sorting is later added.

Expected response:
```json
{
  "data": [
    {
      "id": "EXP-001",
      "name": "Example Experiment",
      "category": "Combustion",
      "description": "Summary text.",
      "dataAvailability": "available",
      "keywords": ["flame", "microgravity"],
      "startDate": "2024-01-01",
      "institution": "NASA"
    }
  ],
  "total": 42,
  "page": 1
}
```

Frontend consumers:
- `frontend/src/features/experiments/pages/ExperimentExplorerPage.tsx`
- `frontend/src/features/experiments/components/ExperimentGrid.tsx`

#### GET `/api/v1/experiments/{experimentId}`
Status: REQUIRED

Expected response:
```json
{
  "data": {
    "id": "EXP-001",
    "name": "Example Experiment",
    "category": "Combustion",
    "description": "Full experiment description.",
    "dataAvailability": "available",
    "institution": "NASA",
    "keywords": ["microgravity", "flame spread"],
    "startDate": "2024-01-01"
  }
}
```

Frontend consumers:
- `frontend/src/features/experiments/pages/ExperimentDetailsPage.tsx`

#### GET `/api/v1/experiments/compare`
Status: PROPOSED

Query parameters:
- `ids` (string or array, required): list of experiment IDs to compare.
- Optional `fields` or `include` values for targeted comparison payload.

Expected response:
```json
{
  "data": [
    {
      "id": "EXP-001",
      "name": "Example Experiment",
      "category": "Combustion",
      "dataAvailability": "available"
    }
  ]
}
```

Frontend consumers:
- Planned comparison page in `frontend/src/features/comparison/pages/ComparisonPage.tsx`

### C. AI Assistant

| Priority | Method | Proposed path | Purpose | Notes |
|---|---|---|---|---|
| PROPOSED | POST | `/api/v1/assistant/questions` | Submit a natural-language research question. | Placeholder for AI workflows. |
| OPTIONAL | GET | `/api/v1/assistant/sessions` | List prior assistant sessions. | Only if saved history is required. |
| OPTIONAL | GET | `/api/v1/assistant/sessions/{sessionId}` | Retrieve conversation data. | Requires confirmation. |
| OPTIONAL | POST | `/api/v1/assistant/sessions` | Create a new session. | Only if AI chats become persistent. |

#### POST `/api/v1/assistant/questions`
Status: PROPOSED

Request body:
```json
{
  "question": "What are the main findings related to flame propagation in this experiment?",
  "context": {
    "experimentIds": ["EXP-001"],
    "includeEvidence": true
  }
}
```

Expected response:
```json
{
  "data": {
    "answer": "AI-generated summary based on available experiment and evidence context.",
    "references": [
      {
        "type": "experiment",
        "id": "EXP-001"
      },
      {
        "type": "evidence",
        "id": "EV-012"
      }
    ],
    "confidence": "medium"
  }
}
```

Frontend consumers:
- `frontend/src/features/assistant/pages/AssistantPage.tsx`

Important rule:
- The contract must preserve a distinction between AI-generated explanation and verified scientific evidence.
- AI answer text must not be presented as the same thing as source-level NASA data or citation metadata.

### D. Evidence Viewer

| Priority | Method | Proposed path | Purpose | Notes |
|---|---|---|---|---|
| REQUIRED | GET | `/api/v1/evidence/{evidenceId}` | Return a single evidence record. | Used by evidence viewer placeholder. |
| PROPOSED | GET | `/api/v1/evidence` | Return a list of evidence items filtered by experiment or source. | Useful for explorer screens. |
| PROPOSED | GET | `/api/v1/experiments/{experimentId}/evidence` | Return evidence related to one experiment. | Useful for detail and assistant workflows. |

#### GET `/api/v1/evidence/{evidenceId}`
Status: REQUIRED for the current UI contract expectation; still UNCONFIRMED for schema and relationship semantics.

Expected response:
```json
{
  "data": {
    "id": "EV-012",
    "title": "Evidence title",
    "type": "publication",
    "summary": "Evidence summary",
    "sourceUrl": "https://example.org/source",
    "relatedExperimentIds": ["EXP-001"],
    "citation": "Source attribution text",
    "isAiGenerated": false,
    "createdAt": "2026-11-15T00:00:00Z"
  }
}
```

Frontend consumers:
- `frontend/src/features/evidence/pages/EvidencePage.tsx`

Important requirement:
- The backend contract must keep NASA source metadata and AI-generated summaries distinct.
- Do not infer publication references or dataset URLs without explicit backend agreement.

---

## 4. Classification summary

The following are the current draft priorities for implementation readiness:

- REQUIRED:
  - Dashboard stats endpoint
  - Dashboard activity endpoint
  - Dashboard featured experiments endpoint
  - Experiment list endpoint
  - Experiment detail endpoint
  - Evidence detail endpoint (for route and placeholder support)
- PROPOSED:
  - Comparison endpoint
  - Assistant question endpoint
  - Related evidence listing endpoints
- OPTIONAL:
  - Session history endpoints for assistant
  - Related experiment/evidence endpoints in richer detail views
- UNCONFIRMED:
  - Exact semantics of evidence, citations, and source attribution
  - AI assistant persistence model and auth behavior
  - Whether data availability is a backend enum or a derived computed state

---

## 5. Open questions requiring backend confirmation

1. What is the canonical resource model for experiments and evidence?
2. Which experiment metadata is NASA source truth versus backend-generated metadata?
3. Which fields are always present, and which are optional?
4. Are filter values and categories enumerated or text-driven?
5. Does the backend already have a stable canonical experiment identifier scheme?
6. Will AI-generated answers be stored or ephemeral?
7. Are assistant conversations part of MVP, or only the request/response pair?
8. Are evidence objects always tied to an experiment, or can they exist independently?
9. Are there any authentication rules for reading public research data?
10. How will not-found, validation, and server errors be returned consistently?

This draft is intentionally narrow and backend-facing: it captures the frontend’s current information needs without assuming the Laravel implementation has already been built.
