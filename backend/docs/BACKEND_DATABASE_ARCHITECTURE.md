# FlameLens AI Backend Database Architecture

## Runtime and dependencies

- Laravel Framework 12.72.0, PHP 8.2.12, MySQL (configured through the existing environment).
- The existing Laravel dependencies are sufficient; no packages were added.
- The `.env` file and its credentials were not changed or printed.

## Tables

All tables use an unsigned bigint auto-incrementing `id` and Laravel `created_at` / `updated_at` timestamps unless otherwise noted. MySQL JSON columns are nullable when the associated data may not be known.

| Table | Columns |
|---|---|
| `experiments` | `catalog_key` nullable unique string for FlameLens internal catalog identity; `nasa_identifier` nullable unique string for an explicitly verified NASA identifier; required `title` string; nullable `acronym`, `program`, and `mission` strings; nullable `summary` text, `description` long text, `nasa_url` text, and `metadata` JSON. |
| `sources` | Nullable `experiment_id` FK; required `title` string, `source_type` indexed string, and `source_url` text; nullable `publisher` string, `publication_date` date, `accessed_at` timestamp, and `metadata` JSON. |
| `publications` | Required `experiment_id` FK and `title` string; nullable `authors` JSON, `publication_type` and `journal` strings, indexed `doi` string, `publication_url` text, `publication_date` date, and `abstract` long text. |
| `media` | Required `experiment_id` FK, `title` string, indexed `media_type` string, and `media_url` text; nullable `description` text, `thumbnail_url` text, `source_id` FK, and `metadata` JSON. |
| `experiment_sections` | Required `experiment_id` FK, `section_type` indexed string, and `title` string; nullable `content` long text and `source_id` FK; `display_order` unsigned integer defaulting to 0, with an `(experiment_id, display_order)` index. |
| `experiment_metrics` | Required `experiment_id` FK and indexed `metric_name` string; nullable `metric_value` decimal(30,12), `unit` string, `conditions` JSON, and `source_id` FK. |

Both unique identifier columns permit multiple `NULL` values. `catalog_key` is an internal identity and must never be represented as a NASA identifier. `nasa_identifier` is populated only from an explicitly verified NASA identifier. The additive catalog-key migration preserves existing experiment rows and leaves their keys null. No catalog records or measurements are imported by the migration.

## Relationships and deletion behavior

- An experiment has many sources, publications, media items, sections, and metrics.
- Sources belong to an experiment optionally. Deleting an experiment sets a source's `experiment_id` to `NULL`, preserving the source record.
- Publications, media items, sections, and metrics belong to an experiment. Deleting an experiment cascades to these experiment-specific records.
- Media, sections, and metrics may refer to a source. Deleting that source sets their `source_id` to `NULL`, preserving the records.

## Models and scientific data

The six domain models define explicit mass-assignable attributes and typed relationship methods. JSON columns cast to arrays, dates to date values, `display_order` to integer, and metric decimals to a 12-place decimal string. Metrics can remain `NULL`; unit and conditions are stored alongside each value and no conversion or cross-experiment comparison is implied. Consumers should compare only values with compatible units and experimental conditions.

## Provenance

Original source records are first-class entities. Source URLs, source type, publisher, publication/access dates, and optional metadata preserve citation context. Media, sections, and metrics may link to a source. Populate these records only with verified material and retain its original URL and relevant provenance; do not treat unlinked or unverified content as confirmed NASA data.

## API foundation and CORS

Laravel API routes are registered under `/api/v1`. The existing `GET /api/v1/status` health route remains, and the first read-only business endpoints are now implemented: `GET /api/v1/experiments`, `GET /api/v1/experiments/{id}`, and `GET /api/v1/dashboard/summary`. Their query rules, explicit API resources, response envelopes, and error handling are documented in [API_IMPLEMENTATION.md](./API_IMPLEMENTATION.md); the approved contract remains in [FRONTEND_API_CONTRACT.md](./FRONTEND_API_CONTRACT.md). No import, comparison, activity, featured-experiment, or AI endpoints were added. CORS applies to API routes and reads a comma-separated origin allowlist from `CORS_ALLOWED_ORIGINS`; it defaults to no allowed origins and does not enable credentials.

## Commands and validation

- `php -v`, `composer --version`, `php artisan --version`, and `composer show --direct --no-interaction`: PHP 8.2.12, Composer 2.11.1, Laravel 12.72.0; dependencies inspected, no additions.
- `php artisan migrate:status`: default Laravel migrations are applied; six domain migrations were pending before implementation.
- `SHOW TABLES` through the configured Laravel MySQL connection: only the existing Laravel tables were present; none of the six domain tables existed before migration.
- `php artisan db:show --counts`: unable to complete because this MySQL server does not provide `performance_schema.session_status` (`42S02`). This does not prevent connecting to the application database; `migrate:status` and the table inspection succeeded.
- `php artisan migrate --force`: all six domain migrations applied successfully as migration batch 2; no existing data was dropped or truncated.
- `php artisan migrate --force`: the additive `catalog_key` migration applied as batch 3; it added a nullable unique column and did not delete or rewrite experiment records.
- `php artisan migrate:status`: all ten migrations report `Ran`.
- MySQL `information_schema.KEY_COLUMN_USAGE`: verified all eight expected foreign-key constraints exist.
- MySQL `information_schema.REFERENTIAL_CONSTRAINTS`: verified experiment-owned records use `CASCADE` and optional source references use `SET NULL`.
- `php artisan route:list --path=api/v1`: confirms the status route and the three implemented read endpoints.
- `php artisan test`: all 6 tests passed (32 assertions), including schema, route, Eloquent relationships, deletion behavior, and preservation of nullable measurements.
- API implementation validation: `php artisan test` passed 27 tests (194 assertions); `vendor/bin/pint --test` passed; `php artisan route:list --path=api/v1` listed the three business endpoints and status route.
- Laravel Pint on changed PHP files: passed.

## Remaining recommendations

- Confirm the deployed MySQL version supports the configured JSON columns and provide allowed frontend origins through `CORS_ALLOWED_ORIGINS` for the deployed client.
- Align the runnable frontend with `/api/v1`, the documented response envelopes, nullable values, internal row IDs, and supported list filters before integration.
- Keep future API additions gated on approved product/scientific decisions; do not infer dashboard activity, featured status, or scientific comparisons from the current schema.
- Populate NASA source and experiment data only through a separately verified ingestion process.
