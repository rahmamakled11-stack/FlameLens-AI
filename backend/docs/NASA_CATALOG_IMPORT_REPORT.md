# NASA Catalog Import Report

## Internal identity strategy

The eight manifest records use unique FlameLens-controlled `catalog_key` values:

- `nasa:combustion:acme`
- `nasa:combustion:bass`
- `nasa:combustion:daft`
- `nasa:combustion:flex`
- `nasa:combustion:saffire`
- `nasa:combustion:same`
- `nasa:combustion:slice`
- `nasa:combustion:spice`

These are internal upsert keys, not official NASA identifiers. `nasa_identifier` remains nullable and is set only when NASA explicitly provides and verifies an experiment-level identifier. Existing rows are assigned no key by the migration.

## Database changes

- Added nullable, unique `experiments.catalog_key` in `2026_11_15_170000_add_catalog_key_to_experiments_table.php`.
- Existing records are preserved; the migration performs no record deletion, table recreation, or data rewrite.
- The rollback removes the unique index and internal key column, but does not delete experiment rows.
- Added `catalog_key` to the Experiment model's fillable fields.
- The additive migration was applied to the configured database. `php artisan migrate:status` reports it as `Ran`.
- At the time this report was first written, the commit import had not yet run. That historical status was superseded by the committed import documented below.

## Import command and preservation policy

The command is:

```powershell
php artisan flamelens:import-nasa-catalog
```

It reads `docs/verified_nasa_experiments.json`, validates the whole manifest, checks duplicate/invalid catalog keys and source references, and prints a create/update/skip summary. It defaults to dry-run and performs no writes.

To explicitly persist after reviewing the dry-run:

```powershell
php artisan flamelens:import-nasa-catalog --commit
```

An alternate manifest can be checked without changing the default path:

```powershell
php artisan flamelens:import-nasa-catalog --file="C:\path\to\manifest.json"
```

The importer applies this conservative manual-edit policy:

1. A previously unseen key creates an experiment, retaining a private importer marker in `experiments.metadata`.
2. A matching existing key without that marker is treated as a conflict; the importer does not adopt or overwrite an unowned record.
3. An importer-managed experiment can be updated only if its imported fields still match the last importer-recorded fingerprint. Any intervening edit to those fields aborts the import.
4. Existing child rows are skipped only when their identifying URL/title and all imported values match exactly. A mismatch is a conflict, not an update. This avoids overwriting manual child edits; resolve such conflicts explicitly before retrying.
5. Source rows are created before sections/media so `source_id` provenance can be linked. Publications retain their cited URL because the current publications table has no source foreign key.
6. All preflight validation/conflict checks run before writes. The commit path rechecks inside a database transaction; any exception rolls the transaction back.
7. Missing values remain null. Metrics are accepted only as explicit manifest records with a source URL belonging to that experiment; this manifest contains none, so the importer creates no metrics. SAME-2 publications/findings remain labeled as SAME-2, BASS-II content remains labeled as BASS-II, DAFT is a separate experiment record from SAME, and Saffire installment labels remain in their sections/publications/media. SPICE is imported with an objectives section only; no completion status or findings are inferred.

## Dry-run result

The default command was run against the configured database after the additive migration, before the later committed import:

| Action | Experiments | Sources | Sections | Publications | Media | Metrics |
|---|---:|---:|---:|---:|---:|---:|
| Create | 8 | 26 | 15 | 13 | 5 | 0 |
| Update | 0 | 0 | 0 | 0 | 0 | 0 |
| Skip (identical) | 0 | 0 | 0 | 0 | 0 | 0 |

At that point the command reported that no records were written; `--commit` had not yet been run. This dry-run is retained here as historical execution detail.

## Tests and verification

Targeted command:

```powershell
php artisan test --filter=NasaCatalogImportTest
```

The full `php artisan test` run passed: 15 tests, 79 assertions. Coverage includes dry-run behavior, initial import, repeat import without duplicates, nullable and unique catalog keys, nullable NASA identifiers, invalid JSON, missing/duplicate keys, source links, SAME-2 scope, BASS-II/SAME/DAFT/Saffire distinctions, SPICE planned-objective-only representation, and refusal to overwrite unmanaged or manually edited records.

Migration status:

```powershell
php artisan migrate:status
```

The new additive migration reports `Ran`; no `migrate:fresh` or truncation was executed.

## Subsequent committed import and database verification

Following the successful committed catalog import, the live database was queried read-only during the subsequent verification:

| Table | Persisted rows |
|---|---:|
| `experiments` | 8 |
| `sources` | 26 |
| `experiment_sections` | 15 |
| `publications` | 13 |
| `media` | 5 |
| `experiment_metrics` | 0 |

The counts were read using Laravel's configured database connection; no import, migration, update, or other write command was run as part of this verification:

```powershell
php artisan tinker --execute="foreach (['experiments', 'sources', 'experiment_sections', 'publications', 'media', 'experiment_metrics'] as $table) { echo $table . ':' . DB::table($table)->count() . PHP_EOL; }"
```

This confirms the current persisted table counts, not the command's exact per-row create/update behavior or a timestamped import log. The earlier dry-run create totals remain historical expectations and are not represented as the measured commit output.

## Remaining issues

- The child table schema has no dedicated internal import-key columns, so changed child payloads intentionally conflict rather than update. A future requirement for child-record updates should add explicit provenance/ownership tracking.
- No scalar metrics exist in the manifest; the importer creates no metric rows.

The catalog records are present in the database; no further import action is required based on the verified counts above.
