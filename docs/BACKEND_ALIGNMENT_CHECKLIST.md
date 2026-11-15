# FlameLens AI — Backend Alignment Checklist

Purpose:
This checklist captures the concrete decisions that must be reviewed with the Laravel backend developer before frontend API integration begins. It is a practical review guide, not a final implementation plan.

## 1. Core resource and database questions

- What are the canonical database tables or models for experiments, evidence, publications, datasets, and research areas?
- Is each experiment uniquely identified by a stable ID, or will IDs be generated in Laravel?
- Are experiment categories stored as lookup values or free-text labels?
- Are there separate tables for NASA source records versus backend-generated metadata?
- Do evidence items always belong to an experiment, or can they exist independently?
- Are research areas, data sources, and publications normalized as reference tables or derived payloads?
- What is the source-of-truth field for experiment names, acronyms, and institution metadata?
- Which fields are required, optional, or nullable?

## 2. Endpoint availability and routing

- Are the API routes under `/api/v1` and not outside that prefix?
- Do the backend routes currently align with the proposed dashboard, experiments, evidence, comparison, and assistant resources?
- Which endpoints are already implemented versus planned?
- Is there a requirement for nested route patterns such as `/api/v1/experiments/{id}/evidence` or `/api/v1/evidence/{id}`?
- Are there conventions for query parameter naming (`q`, `page`, `pageSize`, `category`, etc.)?
- Will the frontend be expected to use Laravel resource classes or raw JSON arrays?

## 3. Response schema and payload agreement

- What is the exact response envelope used for success responses?
- Will the backend wrap all payloads in `{ data: ... }` or use a different convention?
- Are pagination metadata fields named `total`, `page`, `per_page`, `last_page`, or something else?
- Are timestamps in ISO 8601 UTC format, or is a local format expected?
- What is the exact contract for `dataAvailability` or equivalent experiment accessibility status?
- What is the exact structure of `keywords`, `institution`, `startDate`, and other optional metadata?
- Will the backend provide full experiment detail payloads, or only a summary with selected fields?
- Are there strict value enums for category, type, or research area fields?

## 4. Search, filtering, and pagination

- Is search performed server-side or client-side?
- Which fields are searchable: name, acronym, keyword, description, summary, institution, category?
- What is the exact category naming convention for experiment filters?
- Are filters case-sensitive or normalized to a canonical format?
- Will the page size be bounded or user-configurable?
- Is sorting supported for experiment lists or only basic default ordering?
- Will pagination be page-based or cursor-based?
- How should empty results be represented?

## 5. Experiment details and relationships

- Which fields are required to render the experiment detail page?
- Is there a dedicated detail resource or is the list resource reused with extra fields?
- Are scientific objectives, findings, and narrative summaries stored as separate resources or part of the same model?
- Can an experiment have multiple related evidence records, publications, or dataset links?
- Does the backend provide experiment-to-evidence relationships with a stable cross-reference ID?
- Is mission or program metadata included as separate resource data, or nested under experiment metadata?

## 6. Evidence relationships and citation model

- What is the exact meaning of an evidence record?
- Is an evidence record a publication, a dataset, a document, a source note, or an AI-generated explanation?
- Are source URLs and citation strings stored separately from the explanation text?
- Are AI-generated explanations stored as a distinct class or derived content type?
- How should the frontend distinguish verified source metadata from AI-generated interpretation?
- Is each evidence record associated with one experiment, many experiments, or a broader research program?
- Are citations required to be human-readable, machine-readable, or both?

## 7. AI assistant behavior

- Is the AI assistant in MVP mode or a future capability?
- Will the assistant have persistent conversation history, or will it operate statelessly per request?
- If sessions are supported, what is the model for session storage and API lifecycle?
- Should the assistant answer be a direct text response or a structured object with references and confidence metadata?
- Are assistant answers allowed to include citations or references to evidence and experiment records?
- Will AI output be stored separately from verified NASA source data?
- Should the backend sanitize, validate, or moderate the AI response before the frontend renders it?

## 8. Authentication and user state

- Is authentication required for any frontend page, or is the application public by default?
- Will saved comparisons or user-specific history be part of the MVP?
- Are user accounts part of the product scope, or is the project limited to public research browsing?
- Does the Laravel API already have an auth scheme the frontend should support?
- If auth is introduced later, what is the intended token mechanism and session model?

## 9. Error handling and reliability

- What error response format should the frontend expect for validation failures?
- What code or message should be used for not found, forbidden, and server errors?
- Are validation errors returned as arrays, objects, or nested structures?
- Will the frontend need to display backend-supplied details to users?
- What should happen when the backend returns partial or malformed data?

## 10. Deployment and cross-origin expectations

- Is CORS configured for the frontend origin during local development and deployment?
- Will the frontend and Laravel app share the same domain or be separated by origin?
- Are there deployment constraints for SPA routing and API requests?
- Does the backend need to treat `/api/v1/*` as API-only, while frontend routes remain client-side routes?

## 11. Required approval decisions

The following decisions must be explicitly confirmed before implementation:

- Whether the frontend should require auth for reading public research data.
- Whether AI assistant history is part of MVP.
- Whether evidence is a publication, dataset, document, or mixed-type metadata record.
- Which fields are considered NASA source-of-truth metadata vs. server-generated enrichment.
- Whether all experiment filters are server-driven enums or free-form strings.
- Whether `dataAvailability` is a real backend field or a computed frontend status.
- Whether comparison and assistant features are MVP or post-MVP.
- Whether backend responses must preserve source attribution and AI-generated explanations as separate concepts.

## 12. Recommended review format

The backend developer should return one of the following for each proposed endpoint:
- Confirmed and ready for frontend use.
- Approved with schema changes.
- Planned but not yet available.
- Not part of MVP.
- Needs design review.

This checklist should be reviewed as a shared decision record before any feature integration begins.
