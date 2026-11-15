# FlameLens AI API Implementation

## Scope

This implementation provides only the first approved read endpoints under `/api/v1`:

- `GET /api/v1/experiments`
- `GET /api/v1/experiments/{id}`
- `GET /api/v1/dashboard/summary`

The approved contract remains documented in `FRONTEND_API_CONTRACT.md`. The requested `FRONTEND_AUDIT.md` was not present when implementation began; the available audit evidence is recorded in that API contract.

## Listing behavior

`GET /api/v1/experiments` accepts `q`, `program`, `mission`, `page`, `per_page`, `sort`, and `direction`. Search checks only `title`, `acronym`, `summary`, and `description`; program and mission are exact matches. Sorting is limited to `title`, ascending by default, with `id` as a deterministic tie-breaker. Pagination defaults to 9 and is capped at 100. Unknown parameters and unsupported sort/filter values return the shared validation error envelope.

The list response contains an explicit experiment field allowlist, source records with original source URLs, and database counts for sources, publications, media, and metrics. It does not expose importer metadata or `catalog_key`.

## Detail behavior

`GET /api/v1/experiments/{id}` resolves by the internal database row ID and returns explicit resources for sections, sources, publications, media, and metrics. Section and media/metric source links are included only through actual foreign-key relationships. Publications retain their own publication URL because no source foreign key exists for that table. Missing relations are empty arrays; nullable identifiers, scientific values, units, and conditions stay null. Relations are eager loaded and ordered for stable output.

## Dashboard summary behavior

The summary counts persisted publication, experiment, and source rows. `research_areas` remains null because no reviewed taxonomy is stored. The response includes a UTC `generated_at` timestamp; it does not calculate activity or featured experiments.

## Errors and validation

API exceptions use the contract's `{ "error": { "code", "message", "details", "request_id" } }` envelope. Validation errors return `422`; missing resources return `404`. The request ID is also returned as `X-Request-ID`. Unexpected API failures use a generic message, leaving exception reporting to Laravel.

## Testing and data safety

Feature tests use `RefreshDatabase` with the test-only in-memory SQLite connection configured by `phpunit.xml`. They create isolated records and do not import, update, or otherwise access the live NASA catalog database. No migrations were run manually as part of endpoint implementation.

Final validation:

- `php artisan test`: 27 tests passed (194 assertions).
- `vendor/bin/pint --test`: passed.
- `php artisan route:list --path=api/v1`: lists the three business endpoints and the existing status route.
- Read-only live database counts after tests remained 8 experiments, 26 sources, 15 sections, 13 publications, 5 media, and 0 metrics.
