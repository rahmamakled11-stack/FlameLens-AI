# FlameLens AI — Frontend Architecture & Integration Plan

**Status:** Proposal for review; no implementation has begun  
**Basis:** Read-only inspection of `frontend/incoming/task-1/` and `docs/FRONTEND_AUDIT.md`  
**Backend boundary:** Laravel REST API, versioned under `/api/v1`; backend implementation is separate

## Executive summary

`frontend/incoming/task-1/` is the only inspected submission that provides a relevant React + TypeScript frontend foundation. It contains a recognizable application shell, dashboard and experiment-explorer UI, typed models, TanStack Query hooks, and an Axios client. Its source is not a runnable application by itself: it lacks the package/build/style scaffold and React mount entry point. Its detail route is placeholder content, sidebar links point to undeclared routes, and the explorer debounce schedules a timer during render using `useMemo`.

The recommended direction is to retain Task 1 as the source foundation, then organize the app around feature ownership and a consistent boundary:

**React page → feature hook → API service → shared Axios client → Laravel `/api/v1`**

Presentation components should primarily receive typed data and callbacks through props. Feature hooks should own server-state queries and mutations; pages should compose feature UI and own only route-level/local interaction state. The API Contract phase must agree with the Laravel developer on operations, fields, pagination, errors, and evidence/citation semantics before feature requests are implemented.

This document is a proposal, not a confirmed implementation or backend contract. The source facts below are verified from the inspected submission or the existing audit; architectural choices are recommendations unless explicitly marked as open questions.

## Current architecture assessment

### Existing structure and responsibilities

The Task 1 source is organized mainly by broad UI area:

- `App.tsx` is the application shell, provider setup, and route table.
- `components/layout/` contains the `Navbar` and `Sidebar`.
- `dashboard/` contains `DashboardPage` and its stats, activity chart, and featured-experiment components.
- `experiments/` contains the explorer page and search, filter, grid, and card components.
- `hooks/useExperiments.ts` contains dashboard and experiment TanStack Query hooks.
- `lib/api.ts` contains the shared Axios instance and endpoint functions.
- `types/experiment.ts` contains experiment and dashboard data interfaces.

The submission has 15 source files and no package manifest, lockfile, Vite or TypeScript configuration, HTML entry point, React mount entry point, Tailwind/PostCSS configuration, global stylesheet, or test/lint configuration. The source imports `@/...` paths, but no Vite or TypeScript alias configuration is included.

### Assessment by concern

| Concern | Verified current state | Why it matters / recommendation |
|---|---|---|
| Component responsibilities | Explorer leaf components are controlled or prop-driven. Dashboard panels fetch their own data. | Mixed ownership makes presentation components harder to reuse and test. Move queries to feature hooks/pages and pass results and callbacks into presentation components. |
| Page responsibilities | `DashboardPage` composes dashboard panels and quick links. `ExperimentExplorerPage` owns filters, search, pagination, query invocation, and rendering. | Pages should coordinate route-level state and feature composition, not become the only place where UI and server state can be independently tested. Keep page-level interaction state local; keep server data in query hooks. |
| Hooks/data fetching | `useStats`, `useActivity`, `useFeatured`, and `useExperiments` centralize query calls in one file. | This is a useful start but combines multiple features in a generic hook module. Organize query hooks by feature and give keys consistent, typed factories. |
| Debounce | The explorer uses `useMemo` to schedule a timeout and returns a cleanup function that React does not treat as an effect cleanup. | This is a render-time side effect and can leave stale timers running. Replace it with an effect with cleanup, or use an established debounce utility, before relying on search behavior. |
| API client/services | `lib/api.ts` configures Axios with `VITE_API_BASE_URL ?? "/api"` and defines four request functions. | The base path, URLs, query parameter names, and payload envelopes are unconfirmed assumptions. Centralize transport concerns in a client and move feature operations into services; align the base path with `/api/v1` without accidentally duplicating path segments. |
| Response typing | Axios generic arguments and TypeScript interfaces assert response types at compile time. | They do not validate actual JSON at runtime. Agree backend DTOs and map/validate responses at the API boundary before converting them to stable frontend domain types. |
| Type organization | `types/experiment.ts` contains `Experiment`, `Stats`, and `ActivityPoint`. `Experiment.dataAvailability` is a literal union, while category and hook filter strings are broad strings. | Feature types should be explicit and cohesive. Keep frontend/domain models distinct from backend DTOs when mapping or semantics differ; type filter/status values from agreed contract semantics. |
| Routing | `App.tsx` declares `/`, `/experiments`, and `/experiments/:id`; the detail route is a placeholder. Sidebar links `/search` and `/assistant`, and dashboard links `/assistant`, but there are no matching routes. No not-found route exists. | Links can lead to blank/unmatched content, and the details feature is not implemented. Define all product routes, a fallback page, and route-level loading/error boundaries. |
| Application shell | `App.tsx` creates a module-level QueryClient, mounts providers, and renders the sidebar/navbar around the route outlet. | Keep providers and shell composition in app-level files; place route definitions outside an increasingly large component. Configure query defaults deliberately and test provider behavior. |
| Styling | Components use Tailwind utility classes, but no Tailwind, PostCSS, or global-style setup is present. | Class names alone do not produce the intended styles. Establish a single documented styling setup and shared tokens; avoid importing Task 2 bundles or Task 3 global CSS. |
| Dependencies/configuration | Imports imply React, React Router, TanStack Query, Axios, Lucide React, and Recharts. Versions are unknown. | Select and lock mutually compatible dependencies in the scaffold; current compatibility cannot be verified from source alone. |
| State and empty/error UI | `ExperimentGrid` handles loading, error, and empty states through props. Dashboard panels each render some loading/error UI. `StatsCards` substitutes zero for missing fields. | Keep state presentation consistent across features. Do not mask malformed/missing required data as a valid zero; show explicit unavailable/invalid states where appropriate. |
| Reuse/accessibility | `ExperimentCard` uses a clickable `div` with a nested button; its custom key handler handles Enter but not Space. `ExperimentSearch` lacks an explicit accessible label. | Use semantic navigation and non-nested interactive controls, with labels and keyboard behavior supplied by native semantics. |
| Deployment | No SPA hosting/fallback configuration is included. | React Router deep links require the deployment host to serve the app entry point for client-side routes, while keeping API paths routed to Laravel. |

### API assumptions already present in Task 1

The current service code assumes these shapes and operations; none is confirmed by the Laravel API contract:

- Stats returns the `Stats` interface.
- Activity returns an array of `ActivityPoint`.
- Featured experiments returns an array of `Experiment`.
- Experiment listing accepts `q`, `category`, `availability`, `page`, and `pageSize`, and returns `{ data, total, page }`.
- `dataAvailability` is represented as `"available" | "unavailable"` in the frontend.

These are source-level assumptions, not confirmed backend facts. Do not use them to finalize Laravel route names or JSON structures.

## Proposed final frontend architecture

The following is a target proposal, not a set of files to create now. Keep the existing Task 1 submission untouched until implementation is approved. During the source-organization phase, move/adapt its components into the corresponding feature or shared directories.

```text
frontend/
  src/
    app/
      App.tsx
      router.tsx
      providers/
        AppProviders.tsx
      layouts/
        AppShell.tsx
    components/
      layout/
        AppHeader.tsx
        PrimaryNavigation.tsx
      ui/
        Button.tsx
        Card.tsx
        EmptyState.tsx
        ErrorState.tsx
        LoadingState.tsx
    features/
      dashboard/
        components/
        hooks/
        pages/
        services/
        types/
      experiments/
        components/
        hooks/
        pages/
        services/
        types/
      comparison/
        components/
        hooks/
        pages/
        services/
        types/
      assistant/
        components/
        hooks/
        pages/
        services/
        types/
      evidence/
        components/
        hooks/
        pages/
        services/
        types/
    pages/
      NotFoundPage.tsx
    api/
      client.ts
      errors.ts
      types.ts
    types/
      common.ts
    utils/
      formatters.ts
      queryKeys.ts
    config/
      env.ts
      navigation.ts
    styles/
      index.css
  index.html
  package.json
  package-lock.json (or the approved package manager's lockfile)
  tsconfig.json
  tsconfig.app.json
  vite.config.ts
  postcss.config.js (if required by the selected Tailwind setup)
  tailwind.config.js (if required by the selected Tailwind setup)
  .env.example
```

### Major directory responsibilities

- **`app/`** — React app composition, route declarations, global providers, and the application shell. It wires features together but should not contain feature-specific API operations.
- **`app/providers/`** — TanStack Query client/provider and other application-wide providers. Query defaults and lifecycle policies belong here.
- **`app/layouts/`** — Shared layout around routed pages, including responsive navigation/header and route outlet.
- **`components/layout/`** — Reusable navigation/header components that do not own page data. Navigation items should come from configuration or a well-defined app-level source.
- **`components/ui/`** — Generic, domain-neutral primitives such as buttons, cards, and consistent loading/error/empty states. Feature-specific display behavior belongs under its feature.
- **`features/<feature>/components/`** — Components specific to a feature. Prefer presentation-only components with typed props and callbacks; use a clear container/presentation split only where orchestration warrants it.
- **`features/<feature>/hooks/`** — TanStack Query queries and mutations for that feature, including query-key construction and cache invalidation. Hooks call services rather than Axios directly.
- **`features/<feature>/pages/`** — Route-level feature composition and local UI state. Pages use feature hooks, then pass data/state/actions to presentation components.
- **`features/<feature>/services/`** — Feature operations and backend DTO-to-frontend mapping. Services accept typed operation inputs and return frontend-facing values; they do not contain React state.
- **`features/<feature>/types/`** — Feature domain types and, where needed, API DTO types or mapping-related contracts. Types should not imply runtime validation.
- **`pages/`** — Cross-feature pages such as not-found. Feature-owned route pages should remain with their feature.
- **`api/`** — Shared Axios instance, transport defaults/interceptors, common request/response types if useful, and normalized transport/API errors. No feature-specific endpoint definitions here.
- **`types/`** — Small shared domain types only; avoid turning this into a miscellaneous dumping ground.
- **`utils/`** — Pure generic functions shared across features. Do not put feature-specific transformations here.
- **`config/`** — Validated environment access and static app/navigation configuration.
- **`styles/`** — Global CSS/Tailwind entry, base styles, and global design tokens. Feature styling remains local to components or feature styles as agreed.
- **Root scaffold files** — Vite/React entry, TypeScript, package manager, environment template, and CSS tooling configuration required for reproducible local and production builds.

The `features/evidence/` area can be a standalone feature if evidence is independently navigable. If evidence exists only within an experiment or assistant answer, its presentation may be composed there while retaining evidence-specific service and type ownership in this feature; this is an approval decision.

## Component ownership & reusability

The disposition below covers every existing Task 1 source file. “Move” identifies a target location in the proposed structure; it does not authorize moving files now. The recommended separation is that feature hooks own server-state access, pages compose feature state, and display components receive data/state/actions through props.

| Existing file / component | Disposition and proposed destination | Data/state ownership |
|---|---|---|
| `App.tsx` (`App`) | **Refactor; move responsibility** to `src/app/App.tsx`, with routes in `src/app/router.tsx` and providers in `src/app/providers/`. | Owns app composition/providers only. Does not fetch feature data or own page state. |
| `components/layout/Navbar.tsx` (`Navbar`) | **Keep and modify; move** to `src/components/layout/AppHeader.tsx`. | Presentation-only; branding/subtitle should be configured or intentionally fixed. No fetching. |
| `components/layout/Sidebar.tsx` (`Sidebar`) | **Modify; move** to `src/components/layout/PrimaryNavigation.tsx`. | Presentation/navigation only; consume route-aware nav configuration. Remove or disable links until routes exist. No fetching. |
| `dashboard/DashboardPage.tsx` (`DashboardPage`) | **Refactor; move** to `src/features/dashboard/pages/DashboardPage.tsx`. | Page composes dashboard hooks and panels and may own transient page state. It should not duplicate API logic. |
| `dashboard/components/StatsCards.tsx` (`StatsCards`) | **Refactor; move** to `src/features/dashboard/components/StatsCards.tsx`. | Presentation-only with typed stats and state props. Remove the missing-value-to-zero fallback unless zero is contractually valid. |
| `dashboard/components/ResearchActivityChart.tsx` (`ResearchActivityChart`) | **Refactor; move** to `src/features/dashboard/components/ResearchActivityChart.tsx`. | Chart presentation receives normalized chart data and state via props; no hook/API ownership. |
| `dashboard/components/FeaturedExperiments.tsx` (`FeaturedExperiments`) | **Refactor; move** to `src/features/dashboard/components/FeaturedExperiments.tsx`. | Presentational list/cards receive data and state/actions via props. Use a reusable experiment summary/card or feature navigation link. |
| `experiments/ExperimentExplorerPage.tsx` (`ExperimentExplorerPage`) | **Refactor; move** to `src/features/experiments/pages/ExperimentExplorerPage.tsx`. | Owns route-level search/filter/page state and invokes the feature query hook. Fix debounce with effect cleanup and reset pagination consistently. |
| `experiments/components/ExperimentSearch.tsx` (`ExperimentSearch`) | **Keep; move** to `src/features/experiments/components/ExperimentSearch.tsx`. | Controlled presentation; value and change callback via props. Add an accessible name/label. |
| `experiments/components/ExperimentFilters.tsx` (`ExperimentFilters`) | **Modify; move** to `src/features/experiments/components/ExperimentFilters.tsx`. | Controlled presentation; typed category/availability values and options/callbacks via props. Values/options should follow agreed API/domain semantics rather than implicit string assumptions. |
| `experiments/components/ExperimentGrid.tsx` (`ExperimentGrid`) | **Keep and refine; move** to `src/features/experiments/components/ExperimentGrid.tsx`. | Presentation-only; items and loading/error/empty/retry states/actions via props. Maintain distinct empty and failure messages. |
| `experiments/components/ExperimentCard.tsx` (`ExperimentCard`) | **Refactor; move** to `src/features/experiments/components/ExperimentCard.tsx`. | Receives an experiment summary and optional actions via props; presentation/navigation only. Replace nested clickable `div` plus button with semantic, keyboard-accessible navigation/actions. |
| `hooks/useExperiments.ts` (`useStats`, `useActivity`, `useFeatured`, `useExperiments`) | **Refactor; split and move** into `features/dashboard/hooks/` and `features/experiments/hooks/`. | Feature query hooks call services and expose query state. Define stable query keys and typed parameters; hooks do not render UI. |
| `lib/api.ts` (`api`, `getStats`, `getActivity`, `getFeatured`, `getExperiments`) | **Refactor; split responsibilities** between `src/api/client.ts` and feature `services/`. | Shared client owns transport configuration; feature services own operations/mapping. No React hooks or presentation. Replace unconfirmed routes and payload assumptions only after contract agreement. |
| `types/experiment.ts` (`Experiment`, `Stats`, `ActivityPoint`) | **Refactor; split and move** feature types to their owning `features/*/types/`, with truly common types in `src/types/`. | Type definitions only. Separate API DTOs from stable UI/domain models where needed; add runtime schema checking only if chosen and agreed. |

No evidence-specific, comparison, or assistant components exist in Task 1. They are new feature work and should follow the same presentation-versus-data ownership boundary rather than being inferred from Task 2/3.

## Routing plan

These are proposed client-side routes for the six required capabilities. Paths are frontend recommendations, not API endpoints or a confirmed product/navigation contract. Use an application-level not-found route in addition to the feature routes.

| Route path | Page component | Main responsibility | Required route parameters | Navigation entry |
|---|---|---|---|---|
| `/` | `DashboardPage` | Summarize agreed dashboard statistics, research activity, and featured experiments; provide links into features. | None. | Dashboard |
| `/experiments` | `ExperimentExplorerPage` | Search, filter, sort/paginate (if agreed), and browse experiments. | None; filters may be URL query parameters if approved for shareable state. | Experiments |
| `/experiments/:experimentId` | `ExperimentDetailsPage` | Present one experiment, its metadata, related evidence, and available next actions. | `experimentId` (required). | Contextual from explorer/dashboard; not necessarily a standalone sidebar item. |
| `/compare` | `ComparisonPage` | Select and compare eligible experiments using agreed comparison fields and limits. | No required path parameter; selected IDs may be in URL query state or page state, pending decision. | Compare |
| `/assistant` | `AssistantPage` | Accept a research question, display the answer and linked citations/evidence, and handle request state. | None; conversation/session identifier is not assumed. | AI Assistant |
| `/evidence/:evidenceId` | `EvidencePage` | Display a selected evidence item and its provenance/citation details, subject to availability and permissions. | `evidenceId` (required). | Contextual from experiment details/assistant; optionally global only if approved. |
| `*` | `NotFoundPage` | Explain an unknown route and provide safe navigation back to known pages. | None. | No primary nav item. |

**Current gaps:** `/experiments/:id` exists only as placeholder content and should become the details page. `/search` and `/assistant` are currently advertised but undefined; `/search` should either be replaced by the experiment explorer destination or implemented only if product scope explicitly requires a distinct search page. `/compare` and `/evidence/:evidenceId` are not declared. No not-found route is present. The current `/experiments/:id` parameter name is `id`, whereas this proposal uses the descriptive `experimentId`; the choice is not contract-critical but should be consistent.

## Data flow architecture

### Recommended request path

1. A route page reads route parameters and owns transient interaction state (for example, selected filters, current comparison selection, or the unsent assistant question).
2. The page calls a feature query/mutation hook with typed inputs.
3. The hook uses a feature service as its `queryFn`/mutation function and defines a stable query key.
4. The feature service calls the shared Axios client, handles API DTO-to-frontend mapping, and returns frontend-facing data.
5. The client sends requests to the configured versioned Laravel API under `/api/v1`.
6. The hook exposes data, loading/fetching, error, and mutation state to the page; the page passes these to presentation components.

**Flow:** `React Page → Feature Hook → API Service → Axios Client → Laravel REST API`

### Responsibilities and policies

- **Request ownership:** Put Axios configuration, timeouts, shared headers, and transport-level behavior in `src/api/client.ts`. Put operation-specific request construction and response mapping in feature services. Components should not issue HTTP requests directly.
- **Loading/error/empty states:** Feature components render the visual state through props or shared UI components. Pages decide which state applies based on query state and data. A successful empty collection is not the same as a failed request. Use a background-fetch indicator separately when cached data is retained during refresh.
- **Response mapping:** Treat received JSON as untrusted at runtime even when TypeScript types are declared. Define backend DTOs after the API Contract is agreed. Map DTOs into stable UI/domain types in the service boundary when field names, nullable values, timestamps, enum values, or response envelopes differ. Do not treat Axios generic annotations as validation.
- **React Query:** Use a shared configured `QueryClient`; organize query keys by feature and include all query-affecting filters/identifiers in keys. Use queries for server reads, mutations for writes/assistant requests where applicable, explicit retry/staleness/cache settings appropriate to the operation, and targeted invalidation after writes. Avoid fetching in display components. Do not add optimistic updates until mutation semantics and rollback behavior are clear.
- **Error normalization:** Normalize transport errors, Laravel validation errors, authorization errors, not-found responses, throttling, server failures, timeouts, and malformed payloads into a typed application error at the client/service boundary. Preserve safe user-facing message and validation details where supplied, and preserve diagnostic context for logging/telemetry without exposing sensitive data. Do not swallow errors or return success-shaped fallback objects.
- **Avoid duplicate logic:** Keep endpoint/request logic in one feature service operation; use feature hooks as the only React Query integration point for that operation. Shared formatting belongs in pure utilities, and shared transport/error logic belongs in `src/api/`.
- **Cancellation and stale results:** Pass cancellation signals through the query function/client where supported; verify search/filter changes cannot allow stale results to overwrite newer state. Keep the selected URL/history behavior deliberate.
- **Configuration:** Read and validate an API base URL from environment configuration. Ensure exactly one layer supplies `/api/v1`; do not append it in both the environment value and service paths. Keep secrets out of frontend environment variables.

The exact Laravel success/error envelopes, response validation strategy, authentication behavior, retry rules, and caching policy remain undecided until the API Contract and deployment decisions are approved.

## Laravel integration requirements

The list below identifies capabilities and decisions the frontend/backend developers must agree on. It deliberately does not prescribe endpoint names, HTTP methods, request/response JSON, field names, or response envelopes.

| Capability | Expected frontend operation | Information to agree with Laravel developer |
|---|---|---|
| Dashboard statistics | Read the summary values displayed by the dashboard. | Which metrics are authoritative and available; definitions/units and update cadence; null/unknown vs zero semantics; permissions; aggregation/filter context; freshness expectations. |
| Research activity | Read the time-series data used in the activity chart. | Supported measures; time granularity/range/time zone; ordering and missing-period behavior; units and labels; whether multiple series are available; empty-data semantics and any filters. |
| Featured experiments | Read a curated subset for the dashboard. | How “featured” is selected/ordered; maximum or requested count; fields needed by summary cards; stable identifier; availability rules; empty-result behavior and caching/freshness. |
| Experiment listing and filtering | Read a pageable/searchable list; submit search and agreed filters; navigate results. | Searchable fields and matching semantics; filter dimensions and allowed values; sort support; pagination model, limits, and total-count availability; stable IDs; default ordering; availability semantics; validation for unsupported filters; whether filter state can be represented in the URL. |
| Experiment details | Read one experiment by its stable identifier. | Identifier type and canonicality; required/optional fields; relationships to evidence/citations; not-found and access behavior; field-level nullability; related-list pagination; cache/freshness expectations. |
| Experiment comparison | Read or derive comparable records for a selected set of experiments. | Maximum/minimum selections; whether comparison is a dedicated backend operation or composed from existing reads; comparable fields and units; missing/incomparable values; ordering; authorization and data-volume limits. |
| AI assistant questions and answers | Submit a user question and display a response, status, and references. | Request limits/length and validation; synchronous vs asynchronous/streamed behavior; session/context behavior; model failure/rate-limit states; answer provenance; how citations link to evidence; safety/retention policy; authorization and telemetry expectations. |
| Evidence and citations | Read an evidence item or cited source and show attribution/provenance from assistant/detail views. | Stable identifiers; source types and metadata; citation format and provenance fields; availability and external-link behavior; access/permission restrictions; content rendering/sanitization requirements; pagination; behavior for deleted, unavailable, or restricted sources. |

### Cross-cutting contract questions

- What is the canonical API base URL and exact `/api/v1` boundary for local development, staging, and production?
- What authentication/authorization model, if any, applies to each read or write? How are expired credentials and forbidden resources represented?
- What are the standard success, validation, and error formats, including request/correlation identifiers and field-level errors?
- Which date/time formats, identifier types, enum values, and nullability rules are guaranteed?
- What CORS, rate-limit, timeout, pagination-size, and query-complexity limits should the frontend respect?
- Which endpoints support cancellation, sorting, partial fields, or conditional caching?
- What is the supported compatibility/versioning and deprecation policy for `/api/v1`?

These must be resolved in the separate API Contract phase. Do not derive a contract from Task 1's current request code or the unrelated Task 3 prototype.

## Missing scaffold and dependencies

### Required files/configuration

| Item | Purpose / recommendation |
|---|---|
| `package.json` and lockfile | Define scripts, direct dependencies, development dependencies, and reproducible versions. Select one package manager and commit its lockfile. |
| Vite configuration | Add the React plugin, development behavior, and `@` alias consistently with TypeScript. Configure a development API proxy only after the backend/local topology is known. |
| TypeScript configuration | Enable React JSX, strict type checking, app/build separation as appropriate, and matching `baseUrl`/`paths` for `@/*`. |
| `index.html` | Vite HTML entry point and app mount element. |
| React entry point (for example, `src/main.tsx`) | Import global styles and render the app with its providers. |
| Tailwind/PostCSS/global stylesheet | Establish Tailwind generation and global base/tokens. Choose a mutually compatible Tailwind/PostCSS setup and configuration style; include only configuration files required by that version. |
| Environment config and `.env.example` | Document non-secret values such as the API base URL. Validate required configuration once at startup and define whether the value is API origin or already includes `/api/v1`. |
| Router | Use React Router (source already imports it) for the application routes and not-found handling. |
| Server-state library | Use TanStack Query (source already imports it) for remote data, caching, loading, and mutation state. |
| HTTP client | Use Axios (source already imports it), behind the shared client/service boundary. |
| Charts | Use Recharts (source already imports it) if the chosen dashboard chart remains in scope; verify package/React compatibility when versions are selected. |
| Icons | Use Lucide React (source already imports it). |
| Optional test/lint setup | Recommend Vitest and React Testing Library for component/hook tests, plus ESLint and a formatter if those fit team conventions. No such setup is included in Task 1. Add only after implementation scope and team tooling are confirmed. |

### Dependency recommendations

Retain the libraries already implied by Task 1—React, React DOM, React Router, TanStack Query, Axios, Recharts, and Lucide React—unless a compatibility or product requirement argues otherwise. Use Vite with its React integration and TypeScript. Select current mutually compatible stable versions at scaffold time, pin them through the chosen lockfile, and verify peer dependencies with a build. No package versions can be verified from the existing submission, so this document does not claim a tested version set.

Tailwind is implied by current class names but absent as a configured dependency. Select a Tailwind major version and its compatible PostCSS/Vite integration deliberately; do not combine configuration conventions from different Tailwind versions. Establish global CSS and design tokens, and keep imported third-party/global CSS scoped to the intended app.

## Implementation roadmap

Phases are ordered; a phase should not be considered complete until its exit criteria are met. The API Contract is intentionally a gating dependency before feature integration.

| Phase | Work | Prerequisite / exit criteria before next phase |
|---|---|---|
| 1. Project scaffold | Add package manifest/lockfile, Vite + React + TypeScript entry, alias configuration, Tailwind/global CSS, environment template, and basic verification scripts. Keep the work based on Task 1; exclude Task 2 assets and Task 3 source. | Clean dependency install and successful minimal development/build command; strict TypeScript configuration resolves existing imports; environment config is documented. |
| 2. Source organization | Establish the proposed `app/`, `api/`, `features/`, `components/`, `pages/`, `types/`, `utils/`, `config/`, and `styles/` ownership. Refactor/move Task 1 units only after approval; separate services/hooks from presentation and remove known defects coupled to this work. | No unresolved imports; app builds; feature/type ownership is clear; existing dashboard/explorer behavior is preserved where intended; no unrelated submission content is imported. |
| 3. Routing and application shell | Add route table, shared shell, feature navigation, placeholder-safe route pages as appropriate, details route, and not-found behavior. Resolve dead links and SPA deployment fallback requirements. | Every visible navigation link resolves to a deliberate page; route parameters and contextual navigation are consistent; direct route loading works in local preview. |
| 4. Shared API infrastructure | Add environment validation, shared Axios client, common typed error normalization, and query-client configuration without assuming final feature endpoints or response shapes. | API base-path behavior is unambiguous and targets the `/api/v1` boundary correctly; errors are surfaced consistently; infrastructure unit tests or equivalent checks pass. |
| 5. Laravel API contract | Agree and document operations, inputs, outputs, DTO fields/nullability, pagination/filter semantics, errors, authentication, rate limits, assistant/citation behavior, and versioning with the backend developer. Keep this contract separate from guesses in the current Task 1 code. | Frontend and backend owners approve the contract and representative fixtures/examples; every required feature operation has a defined success and failure behavior. |
| 6. Feature integration | Implement feature services and DTO mappings, then hooks/query keys and pages for dashboard, explorer, details, comparison, assistant, and evidence according to the agreed contract. | Each feature operation matches the approved contract; typed models and mapping tests cover normal and edge responses; no UI component duplicates HTTP logic. |
| 7. Loading, error, and empty states | Standardize initial loading, background refetch, empty results, not-found, validation, authorization, rate-limit, network, malformed-response, and server-error UI. Confirm keyboard/accessibility behavior. | Each feature has deliberate states for expected outcomes; failures are visible and retry behavior is appropriate; empty data is not confused with an error or fabricated zero. |
| 8. Testing and build verification | Add/run focused unit/component/hook/service tests, API mapping/error tests, route tests, type checking, linting, and production build. Use agreed fixtures, not invented research data. | Required checks pass; any intentionally deferred coverage or known limitation is documented; clean production build is reproducible from the lockfile. |
| 9. Deployment readiness | Configure production API origin/base path, HTTPS/CORS as applicable, SPA deep-link fallback, caching/security headers, and environment-specific build/deploy checks. Validate direct loads and API connectivity in the target environment. | Production build and deployment configuration are verified against staging/hosting; deep links route to the SPA while API requests reach Laravel; no secrets are embedded in client assets. |

**Dependencies:** Phase 1 is prerequisite for running the app. Phase 2 establishes maintainable ownership. Phase 3 makes feature routes explicit. Phase 4 can proceed without finalized endpoints, but Phase 5 must be approved before endpoint-specific feature integration in Phase 6. State handling and meaningful tests depend on implemented feature semantics/contracts. Deployment readiness depends on the selected production host and API origin.

## Important architectural decisions requiring approval

1. **Foundation and scope:** Confirm Task 1 as the sole frontend source foundation and confirm Task 2 downloaded assets and Task 3 SecureAI source remain excluded.
2. **Target source layout:** Approve the feature-first organization and the presentation/page/hook/service ownership boundary.
3. **Routes/navigation:** Approve proposed paths and whether Compare and Evidence appear in primary navigation or only as contextual destinations; decide if `/search` is an alias/redirect to `/experiments` or is removed.
4. **Comparison selection state:** Decide whether selected experiment IDs live in URL query state (shareable/deep-linkable) or local page state, and define selection limits through product/API agreement.
5. **Evidence ownership:** Decide whether evidence is an independently navigable feature and whether an evidence detail route is required, or if evidence remains embedded/contextual in experiment details and assistant answers.
6. **API base configuration:** Decide whether the environment variable holds only the API origin or includes `/api/v1`; ensure a single source adds the version prefix. Agree local proxy and deployment routing.
7. **API contract and error model:** Obtain backend approval for routes, DTOs, nullability, pagination/filtering, errors, assistant interaction, and citation/evidence behavior before implementing service calls.
8. **Runtime payload validation:** Decide whether to use a schema-validation library or focused manual parsing at the service boundary. In either case, TypeScript declarations alone are not runtime validation.
9. **Authentication and privacy:** Confirm whether endpoints are public or authenticated and any required treatment of user questions, history, telemetry, retention, or sensitive information.
10. **UI/product configuration:** Confirm whether category values, dashboard metric labels/definitions, page size, branding copy, and availability labels are fixed product choices or backend/config-driven.
11. **Dependency and quality tooling:** Approve package manager, mutually compatible dependency versions, Tailwind major version, and whether to include Vitest/Testing Library, ESLint, and formatting tooling in the scaffold.
12. **Deployment target:** Identify the hosting/runtime so SPA fallback, API proxy/origin, CORS, and environment configuration can be verified.

## Unresolved questions

- What is the backend developer's timeline and process for approving the API Contract, and who owns maintaining it as `/api/v1` evolves?
- Are dashboard counts/series available from Laravel, and what are their authoritative definitions, units, and freshness guarantees?
- Which experiment filters, sorting, pagination behavior, and maximum page size will the API support?
- Are comparison and evidence operations separate backend capabilities, or should the frontend compose existing experiment/evidence reads?
- Does the AI assistant need conversation history, streaming, or asynchronous job status, and what evidence citation guarantees are expected?
- Is any frontend authentication required, and what user/session data may be retained or transmitted?
- Which production host and local development topology will serve the SPA and `/api/v1`?
- Should evidence be a top-level navigation destination or a contextual viewer only?

