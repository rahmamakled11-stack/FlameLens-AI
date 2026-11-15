# FlameLens AI — API Infrastructure Plan

Status: Architecture preparation only. This document describes the intended frontend integration pattern for a later Laravel contract implementation. It does not implement API behavior or backend code.

## 1. Intended frontend data flow

React Page
→ Feature Hook
→ Feature Service
→ Shared Axios Client
→ Laravel REST API

This is the target contract boundary for the frontend architecture.

## 2. Responsibilities by layer

### React page layer
Files such as:
- `frontend/src/features/dashboard/pages/DashboardPage.tsx`
- `frontend/src/features/experiments/pages/ExperimentExplorerPage.tsx`
- `frontend/src/features/experiments/pages/ExperimentDetailsPage.tsx`

Responsibility:
- Compose feature UI and route-level state.
- Keep page-local interaction state (search text, selected filters, current page, route params) separate from backend data.
- Render loading, error, and empty states provided by hooks or feature-level components.

### Feature hook layer
Files such as:
- `frontend/src/features/dashboard/hooks/useDashboardData.ts`
- `frontend/src/features/experiments/hooks/useExperiments.ts`

Responsibility:
- Own React Query usage for a feature.
- Define query keys, query functions, enabled conditions, and retry rules.
- Hide data-fetching details from UI components.
- Keep keys stable and include filters/search/page parameters when they affect the result set.

### Feature service layer
Files such as:
- `frontend/src/features/dashboard/services/dashboardService.ts`
- `frontend/src/features/experiments/services/experimentsService.ts`

Responsibility:
- Contain raw API interaction logic.
- Map HTTP responses into frontend DTOs or domain models.
- Keep URL and parameter conventions in one place.
- Avoid directly coupling the UI to transport details.

### Shared Axios client layer
File:
- `frontend/src/api/client.ts`

Responsibility:
- Configure the shared Axios instance.
- Manage the base URL and default headers.
- Centralize request/response handling.
- Avoid scattering URL strings across feature files.

### Laravel API boundary
- `GET /api/v1/...` and `POST /api/v1/...` endpoints from the final backend contract.
- The frontend should not assume endpoint details beyond the agreed draft contract.

## 3. Shared Axios client responsibilities

The frontend should keep a single shared Axios instance with:
- a base URL derived from `VITE_API_BASE_URL`
- a request timeout for network safety
- a default JSON content type
- optional auth token support when backend auth is approved later

Potential responsibilities:
- normalize response `data` extraction
- standardize error objects before returning to hooks/services
- avoid leaking backend-specific error envelopes directly to React components

Recommended pattern:
- Request returns the raw `response.data` payload or a normalized wrapper.
- Services then map that to frontend structures.
- Hooks are responsible for query-state handling, not for backend data transformation logic.

## 4. Error normalization strategy

The frontend should normalize backend errors into a consistent structure before UI rendering, for example:
```ts
{
  status: 400,
  message: "Unable to load experiments.",
  code: "FETCH_FAILED",
  details?: Record<string, string[]>
}
```

This should be used by:
- feature hooks for `isError` and `error` handling
- UI components for consistent empty/error/loading states
- retry actions and user feedback patterns

Key rule:
- Keep error normalization stable even if backend contracts change.
- Consumers should not need to know whether the error came from validation, not found, or server-level exceptions.

## 5. React Query usage conventions

Recommended patterns:
- Query keys should be feature-scoped and include all parameters that affect the result set.
- Example keys:
  - `['dashboard', 'stats']`
  - `['dashboard', 'activity']`
  - `['dashboard', 'featured']`
  - `['experiments', 'list', { q, category, availability, page, pageSize }]`
  - `['experiments', 'detail', experimentId]`
- Use `enabled` guards when a route param or filter value is missing.
- Use `placeholderData` or cached data only when the frontend intentionally wants to hold previous results while new filters are applied.
- Keep `retry` configuration consistent and explicit.
- Do not place request logic directly inside page components.

## 6. DTO and domain model mapping

The frontend currently uses a few typed resources, including:
- `Stats`
- `ActivityPoint`
- `Experiment`
- `ExperimentsResponse`

Recommended mapping principle:
- Backend DTOs are transport-level schema contracts.
- Frontend domain models are stable UI-facing structures.
- Map backend values to UI models in the service layer, not inside components.

Example mapping approach:
- backend `data_availability` -> frontend `dataAvailability`
- backend `experiment_id` -> frontend `id`
- backend `published_at` -> frontend `startDate` only when the semantics are agreed

Important rule:
- Frontend types should describe the app’s contract, not pretend to validate the backend response at runtime.

## 7. Request and response interceptors

If the project adopts interceptors, they should be limited to cross-cutting concerns such as:
- injecting an auth token when approved
- attaching versioned request headers if required by Laravel
- standardizing response data extraction
- converting backend failures into a normalized error object

Avoid using interceptors for business logic.

## 8. Feature-specific contract expectations

### Dashboard
- Stats summary endpoint returns counts only.
- Activity endpoint returns a time series for graph rendering.
- Featured experiments endpoint returns top-level experiment summaries.

### Explorer
- Query params are filter-driven and should be included in query keys.
- Result payload must have pagination metadata or a clearly agreed alternative.
- Search should not be treated as a server-side guarantee if the backend contract is not final.

### Detail pages
- Detail endpoints should return the full resource needed for display.
- Some fields may be optional or null, and the UI should handle that gracefully.

### Comparison and assistant
- These are not yet fully specified in the frontend.
- Any request/response structure must be agreed before implementation.

## 9. Data handling rules

The frontend should treat backend data as untrusted until validated through a contract agreement.

Required rules:
- Never silently convert a missing or malformed required statistical field to zero without explicit product approval.
- Do not treat `null`, `undefined`, or empty arrays as valid data unless the contract explicitly allows them.
- Keep empty-state and error-state messages user-friendly but accurate.
- Maintain clear separation between source scientific data and AI-generated explanation.

## 10. Proposed implementation sequence after contract approval

1. Finalize Laravel contract with backend developer.
2. Add typed DTO mapping layer.
3. Implement feature services for dashboard and experiments.
4. Add query hooks with final query keys.
5. Replace temporary placeholders for comparison, assistant, and evidence only after the contract is settled.
6. Add end-to-end validation and error-state checks.

This plan remains intentionally architecture-first and does not begin implementation. It is meant to prepare the frontend for a clean Laravel integration once the backend contract is approved.
