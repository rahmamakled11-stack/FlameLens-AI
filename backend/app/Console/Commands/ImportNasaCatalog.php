<?php

namespace App\Console\Commands;

use App\Models\Experiment;
use App\Models\ExperimentMetric;
use App\Models\ExperimentSection;
use App\Models\Media;
use App\Models\Publication;
use App\Models\Source;
use Illuminate\Console\Command;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Support\Carbon;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Validator;
use Illuminate\Validation\ValidationException;
use JsonException;
use Throwable;

class ImportNasaCatalog extends Command
{
    protected $signature = 'flamelens:import-nasa-catalog
                            {--commit : Persist the validated catalog import}
                            {--file= : Use an alternate JSON manifest path}';

    protected $description = 'Validate and import the verified NASA experiment catalog (dry-run by default)';

    private const MANAGED_METADATA_KEY = 'flamelens_catalog_import';

    public function handle(): int
    {
        try {
            $records = $this->loadManifest((string) ($this->option('file') ?: base_path('docs/verified_nasa_experiments.json')));
            $plan = $this->buildPlan($records);
        } catch (ValidationException $exception) {
            $messages = collect($exception->errors())->flatten()->implode(PHP_EOL);
            $this->components->error($messages !== '' ? $messages : $exception->getMessage());

            return self::FAILURE;
        } catch (JsonException $exception) {
            $this->components->error('Invalid JSON: '.$exception->getMessage());

            return self::FAILURE;
        } catch (Throwable $exception) {
            $this->components->error('Catalog validation failed: '.$exception->getMessage());

            return self::FAILURE;
        }

        $this->displayPlan($plan);

        if (! $this->option('commit')) {
            $this->components->info('Dry run only. No records were written. Use --commit to persist this import.');

            return self::SUCCESS;
        }

        try {
            DB::transaction(function () use ($records): void {
                $plan = $this->buildPlan($records);
                $this->persistPlan($plan);
            });
        } catch (Throwable $exception) {
            $this->components->error('Catalog import rolled back: '.$exception->getMessage());

            return self::FAILURE;
        }

        $this->components->info('Catalog import committed successfully.');

        return self::SUCCESS;
    }

    /**
     * @return array<int, array<string, mixed>>
     *
     * @throws JsonException
     * @throws ValidationException
     */
    private function loadManifest(string $path): array
    {
        if (! is_file($path) || ! is_readable($path)) {
            throw ValidationException::withMessages(['manifest' => "Manifest is not readable: {$path}"]);
        }

        $decoded = json_decode((string) file_get_contents($path), true, 512, JSON_THROW_ON_ERROR);
        if (! is_array($decoded) || ($decoded['manifest_version'] ?? null) !== 1 || ! is_array($decoded['experiments'] ?? null) || $decoded['experiments'] === []) {
            throw ValidationException::withMessages(['manifest' => 'Manifest must use version 1 and contain a non-empty experiments array.']);
        }

        $keys = [];
        foreach ($decoded['experiments'] as $index => $record) {
            if (! is_array($record)) {
                throw ValidationException::withMessages(["experiments.{$index}" => 'Each experiment must be an object.']);
            }

            $validator = Validator::make($record, [
                'catalog_key' => ['required', 'string', 'max:255', 'regex:/^nasa:combustion:[a-z0-9][a-z0-9-]*$/'],
                'title' => ['required', 'string', 'max:255'],
                'acronym' => ['nullable', 'string', 'max:255'],
                'nasa_identifier' => ['nullable', 'string', 'max:255'],
                'program' => ['nullable', 'string', 'max:255'],
                'mission' => ['nullable', 'string', 'max:255'],
                'summary' => ['nullable', 'string'],
                'description' => ['nullable', 'string'],
                'nasa_url' => ['nullable', 'url'],
                'sections' => ['present', 'array'],
                'publications' => ['present', 'array'],
                'media' => ['present', 'array'],
                'sources' => ['required', 'array'],
            ]);

            if ($validator->fails()) {
                throw ValidationException::withMessages(["experiments.{$index}" => $validator->errors()->all()]);
            }

            $key = $record['catalog_key'];
            if (isset($keys[$key])) {
                throw ValidationException::withMessages(['catalog_key' => "Duplicate catalog_key '{$key}' in manifest."]);
            }
            $keys[$key] = true;

            $sourceUrls = [];
            foreach ($record['sources'] as $sourceIndex => $source) {
                $this->validateItem($source, [
                    'title' => ['required', 'string', 'max:255'],
                    'source_type' => ['required', 'string', 'max:255'],
                    'source_url' => ['required', 'url'],
                    'publisher' => ['nullable', 'string', 'max:255'],
                    'publication_date' => ['nullable', 'date_format:Y-m-d'],
                    'accessed_at' => ['nullable', 'date'],
                ], "experiments.{$index}.sources.{$sourceIndex}");
                if (isset($sourceUrls[$source['source_url']])) {
                    throw ValidationException::withMessages(["experiments.{$index}.sources" => 'Duplicate source URL.']);
                }
                $sourceUrls[$source['source_url']] = true;
            }

            foreach (['sections', 'publications', 'media'] as $collection) {
                $identities = [];
                foreach ($record[$collection] as $itemIndex => $item) {
                    $rules = match ($collection) {
                        'sections' => [
                            'section_type' => ['required', 'string', 'max:255'],
                            'title' => ['required', 'string', 'max:255'],
                            'content' => ['nullable', 'string'],
                            'source_url' => ['required', 'url'],
                        ],
                        'publications' => [
                            'title' => ['required', 'string', 'max:255'],
                            'authors' => ['nullable', 'array'],
                            'publication_type' => ['nullable', 'string', 'max:255'],
                            'journal' => ['nullable', 'string', 'max:255'],
                            'doi' => ['nullable', 'string', 'max:255'],
                            'publication_url' => ['nullable', 'url'],
                            'publication_date' => ['nullable', 'date_format:Y-m-d'],
                            'abstract' => ['nullable', 'string'],
                            'source_url' => ['required', 'url'],
                        ],
                        default => [
                            'title' => ['required', 'string', 'max:255'],
                            'description' => ['nullable', 'string'],
                            'media_type' => ['required', 'string', 'max:255'],
                            'media_url' => ['required', 'url'],
                            'thumbnail_url' => ['nullable', 'url'],
                            'source_url' => ['required', 'url'],
                        ],
                    };
                    $this->validateItem($item, $rules, "experiments.{$index}.{$collection}.{$itemIndex}");
                    if (! isset($sourceUrls[$item['source_url']])) {
                        throw ValidationException::withMessages(["experiments.{$index}.{$collection}.{$itemIndex}.source_url" => 'Referenced source_url is missing from this experiment sources list.']);
                    }
                    $identity = match ($collection) {
                        'sections' => $item['source_url'].'|'.$item['section_type'].'|'.$item['title'],
                        'publications' => $item['publication_url'] ?? $item['title'],
                        default => $item['media_url'],
                    };
                    if (isset($identities[$identity])) {
                        throw ValidationException::withMessages(["experiments.{$index}.{$collection}" => 'Duplicate child identity in manifest.']);
                    }
                    $identities[$identity] = true;
                }
            }

            if (array_key_exists('metrics', $record)) {
                if (! is_array($record['metrics'])) {
                    throw ValidationException::withMessages(["experiments.{$index}.metrics" => 'Metrics must be an array when present.']);
                }
                $metricIdentities = [];
                foreach ($record['metrics'] as $metricIndex => $metric) {
                    $this->validateItem($metric, [
                        'metric_name' => ['required', 'string', 'max:255'],
                        'metric_value' => ['nullable', 'regex:/^-?\d{1,18}(?:\.\d{1,12})?$/'],
                        'unit' => ['nullable', 'string', 'max:255'],
                        'conditions' => ['nullable', 'array'],
                        'source_url' => ['required', 'url'],
                    ], "experiments.{$index}.metrics.{$metricIndex}");
                    if (! isset($sourceUrls[$metric['source_url']])) {
                        throw ValidationException::withMessages(["experiments.{$index}.metrics.{$metricIndex}.source_url" => 'Referenced source_url is missing from this experiment sources list.']);
                    }
                    $identity = $metric['source_url'].'|'.$metric['metric_name'].'|'.($metric['unit'] ?? '').'|'.json_encode($metric['conditions'] ?? null, JSON_THROW_ON_ERROR | JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES);
                    if (isset($metricIdentities[$identity])) {
                        throw ValidationException::withMessages(["experiments.{$index}.metrics" => 'Duplicate metric identity in manifest.']);
                    }
                    $metricIdentities[$identity] = true;
                }
            }
        }

        return $decoded['experiments'];
    }

    /**
     * @param  array<string, array<int, string>>  $rules
     */
    private function validateItem(mixed $item, array $rules, string $path): void
    {
        if (! is_array($item)) {
            throw ValidationException::withMessages([$path => 'Each item must be an object.']);
        }

        $validator = Validator::make($item, $rules);
        if ($validator->fails()) {
            throw ValidationException::withMessages([$path => $validator->errors()->all()]);
        }
    }

    /**
     * @param  array<int, array<string, mixed>>  $records
     * @return array<int, array<string, mixed>>
     */
    private function buildPlan(array $records): array
    {
        $plan = [];
        foreach ($records as $record) {
            $experiment = Experiment::query()->where('catalog_key', $record['catalog_key'])->first();
            $fields = $this->experimentFields($record);
            $metadata = $experiment?->metadata ?? [];
            $marker = is_array($metadata) ? ($metadata[self::MANAGED_METADATA_KEY] ?? null) : null;

            if ($experiment && ! is_array($marker)) {
                throw new \RuntimeException("Existing experiment '{$record['catalog_key']}' is not marked as catalog-managed; refusing to overwrite it.");
            }
            if ($experiment && $this->hash($this->experimentFieldsFromModel($experiment)) !== ($marker['fields_hash'] ?? null)) {
                throw new \RuntimeException("Existing experiment '{$record['catalog_key']}' has edits outside the importer; refusing to overwrite it.");
            }

            $managedItems = is_array($marker['items'] ?? null) ? $marker['items'] : [];
            $sourcePlans = $this->planSources($record['sources'], $experiment, $managedItems);
            $sectionPlans = $this->planSections($record['sections'], $experiment, $managedItems);
            $publicationPlans = $this->planPublications($record['publications'], $experiment, $managedItems);
            $mediaPlans = $this->planMedia($record['media'], $experiment, $managedItems);
            $metricPlans = $this->planMetrics($record['metrics'] ?? [], $experiment, $managedItems);
            $currentTrackingKeys = [];
            foreach ([$sourcePlans, $sectionPlans, $publicationPlans, $mediaPlans, $metricPlans] as $children) {
                foreach ($children as $child) {
                    $currentTrackingKeys[] = $child['tracking_key'];
                }
            }
            $removedItems = array_diff(array_keys($managedItems), $currentTrackingKeys);
            if ($removedItems !== []) {
                throw new \RuntimeException("Catalog child identities were removed or changed for '{$record['catalog_key']}'; refusing to delete or duplicate existing child records.");
            }

            $plan[] = [
                'record' => $record,
                'experiment' => $experiment,
                'fields' => $fields,
                'source_plans' => $sourcePlans,
                'section_plans' => $sectionPlans,
                'publication_plans' => $publicationPlans,
                'media_plans' => $mediaPlans,
                'metric_plans' => $metricPlans,
            ];
        }

        return $plan;
    }

    /**
     * @param  array<string, mixed>  $record
     * @return array<string, mixed>
     */
    private function experimentFields(array $record): array
    {
        return [
            'nasa_identifier' => $record['nasa_identifier'] ?? null,
            'title' => $record['title'],
            'acronym' => $record['acronym'] ?? null,
            'program' => $record['program'] ?? null,
            'mission' => $record['mission'] ?? null,
            'summary' => $record['summary'] ?? null,
            'description' => $record['description'] ?? null,
            'nasa_url' => $record['nasa_url'] ?? null,
        ];
    }

    /**
     * @return array<string, mixed>
     */
    private function experimentFieldsFromModel(Experiment $experiment): array
    {
        $fields = [];
        foreach (array_keys($this->experimentFields(['title' => ''])) as $field) {
            $fields[$field] = $experiment->getAttribute($field);
        }

        return $fields;
    }

    /**
     * @param  array<int, array<string, mixed>>  $items
     * @return array<int, array<string, mixed>>
     */
    private function planSources(array $items, ?Experiment $experiment, array $managedItems): array
    {
        return $this->planChildren($items, $experiment, Source::class, 'source_url', function (array $item): array {
            return [
                'title' => $item['title'],
                'source_type' => $item['source_type'],
                'source_url' => $item['source_url'],
                'publisher' => $item['publisher'] ?? null,
                'publication_date' => $item['publication_date'] ?? null,
                'accessed_at' => $item['accessed_at'] ?? null,
                'metadata' => null,
            ];
        }, null, $managedItems);
    }

    /**
     * @param  array<int, array<string, mixed>>  $items
     * @return array<int, array<string, mixed>>
     */
    private function planSections(array $items, ?Experiment $experiment, array $managedItems): array
    {
        return $this->planChildren($items, $experiment, ExperimentSection::class, null, function (array $item, int $index) use ($experiment): array {
            $source = $experiment?->sources()->where('source_url', $item['source_url'])->first();

            return [
                'section_type' => $item['section_type'],
                'title' => $item['title'],
                'content' => $item['content'] ?? null,
                'display_order' => $index,
                'source_id' => $source?->id,
            ];
        }, function (array $item): string {
            return $item['source_url'].'|'.$item['section_type'].'|'.$item['title'];
        }, $managedItems);
    }

    /**
     * @param  array<int, array<string, mixed>>  $items
     * @return array<int, array<string, mixed>>
     */
    private function planPublications(array $items, ?Experiment $experiment, array $managedItems): array
    {
        return $this->planChildren($items, $experiment, Publication::class, 'publication_url', function (array $item): array {
            return [
                'title' => $item['title'],
                'authors' => $item['authors'] ?? null,
                'publication_type' => $item['publication_type'] ?? null,
                'journal' => $item['journal'] ?? null,
                'doi' => $item['doi'] ?? null,
                'publication_url' => $item['publication_url'] ?? null,
                'publication_date' => $item['publication_date'] ?? null,
                'abstract' => $item['abstract'] ?? null,
            ];
        }, function (array $item): string {
            return $item['publication_url'] ?? $item['title'];
        }, $managedItems);
    }

    /**
     * @param  array<int, array<string, mixed>>  $items
     * @return array<int, array<string, mixed>>
     */
    private function planMedia(array $items, ?Experiment $experiment, array $managedItems): array
    {
        return $this->planChildren($items, $experiment, Media::class, 'media_url', function (array $item) use ($experiment): array {
            $source = $experiment?->sources()->where('source_url', $item['source_url'])->first();

            return [
                'title' => $item['title'],
                'description' => $item['description'] ?? null,
                'media_type' => $item['media_type'],
                'media_url' => $item['media_url'],
                'thumbnail_url' => $item['thumbnail_url'] ?? null,
                'source_id' => $source?->id,
                'metadata' => null,
            ];
        }, null, $managedItems);
    }

    /**
     * @param  array<int, array<string, mixed>>  $items
     * @return array<int, array<string, mixed>>
     */
    private function planMetrics(array $items, ?Experiment $experiment, array $managedItems): array
    {
        return $this->planChildren($items, $experiment, ExperimentMetric::class, null, function (array $item) use ($experiment): array {
            $source = $experiment?->sources()->where('source_url', $item['source_url'])->first();

            return [
                'metric_name' => $item['metric_name'],
                'metric_value' => $this->normalizeMetricValue($item['metric_value'] ?? null),
                'unit' => $item['unit'] ?? null,
                'conditions' => $item['conditions'] ?? null,
                'source_id' => $source?->id,
            ];
        }, function (array $item): string {
            return $item['source_url'].'|'.$item['metric_name'].'|'.($item['unit'] ?? '').'|'.json_encode($item['conditions'] ?? null, JSON_THROW_ON_ERROR | JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES);
        }, $managedItems);
    }

    /**
     * @param  array<int, array<string, mixed>>  $items
     * @param  class-string<Model>  $modelClass
     * @param  callable(array<string, mixed>, int): array<string, mixed>  $attributes
     * @param  (callable(array<string, mixed>): string)|null  $identity
     * @param  array<string, array{id: int, hash: string}>  $managedItems
     * @return array<int, array<string, mixed>>
     */
    private function planChildren(array $items, ?Experiment $experiment, string $modelClass, ?string $identityColumn, callable $attributes, ?callable $identity = null, array $managedItems = []): array
    {
        $plans = [];
        foreach ($items as $index => $item) {
            $values = $attributes($item, $index);
            $itemIdentity = $identity ? $identity($item) : ($identityColumn ? (string) $values[$identityColumn] : (string) $index);
            $kind = match ($modelClass) {
                Source::class => 'source',
                ExperimentSection::class => 'section',
                Publication::class => 'publication',
                Media::class => 'media',
                ExperimentMetric::class => 'metric',
                default => throw new \InvalidArgumentException("Unsupported catalog model {$modelClass}."),
            };
            $trackingKey = $kind.':'.hash('sha256', $itemIdentity);
            $tracked = $managedItems[$trackingKey] ?? null;

            if (is_array($tracked)) {
                $existing = $experiment
                    ? $modelClass::query()->where('experiment_id', $experiment->id)->find($tracked['id'] ?? 0)
                    : null;
                if (! $existing || $this->hash($this->modelPayload($existing)) !== ($tracked['hash'] ?? null)) {
                    throw new \RuntimeException("Previously imported {$kind} data has been changed or removed; refusing to overwrite or duplicate it.");
                }
            } elseif ($modelClass === ExperimentSection::class) {
                $source = $experiment?->sources()->where('source_url', $item['source_url'])->first();
                $existing = $experiment?->sections()
                    ->where('section_type', $values['section_type'])
                    ->where('title', $values['title'])
                    ->where('source_id', $source?->id)
                    ->first();
            } elseif ($modelClass === ExperimentMetric::class && $experiment) {
                $source = $experiment->sources()->where('source_url', $item['source_url'])->first();
                $candidates = $experiment->metrics()
                    ->where('metric_name', $values['metric_name'])
                    ->where('unit', $values['unit'])
                    ->where('source_id', $source?->id)
                    ->get();
                $existing = $candidates->first(fn (ExperimentMetric $candidate): bool => $this->hash(['conditions' => $candidate->conditions]) === $this->hash(['conditions' => $values['conditions']]));
            } elseif ($modelClass === Publication::class && $experiment) {
                $query = $experiment->publications();
                $existing = $values['publication_url'] !== null
                    ? $query->where('publication_url', $values['publication_url'])->first()
                    : $query->where('title', $values['title'])->first();
            } elseif ($experiment && $identityColumn) {
                $existing = $experiment->{$this->relationFor($modelClass)}()
                    ->where($identityColumn, $values[$identityColumn])
                    ->first();
            } else {
                $existing = null;
            }

            if ($existing && $this->hash($this->modelPayload($existing)) !== $this->hash($values)) {
                throw new \RuntimeException("Existing {$modelClass} record conflicts with catalog data; refusing to overwrite manually edited information.");
            }

            $plans[] = [
                'model' => $modelClass,
                'item' => $item,
                'values' => $values,
                'existing' => $existing,
                'identity' => $itemIdentity,
                'tracking_key' => $trackingKey,
            ];
        }

        return $plans;
    }

    private function relationFor(string $modelClass): string
    {
        return match ($modelClass) {
            Source::class => 'sources',
            Publication::class => 'publications',
            Media::class => 'media',
            ExperimentMetric::class => 'metrics',
            default => throw new \InvalidArgumentException("Unsupported catalog model {$modelClass}."),
        };
    }

    /**
     * @return array<string, mixed>
     */
    private function modelPayload(Model $model): array
    {
        $payload = [];
        foreach ($model->getFillable() as $field) {
            if ($field !== 'experiment_id') {
                $value = $model->getAttribute($field);
                if ($value instanceof Carbon || $value instanceof \DateTimeInterface) {
                    $value = $field === 'accessed_at' ? $value->format('Y-m-d H:i:s') : $value->format('Y-m-d');
                }
                $payload[$field] = $value;
            }
        }

        return $payload;
    }

    /**
     * @param  array<int, array<string, mixed>>  $plan
     */
    private function displayPlan(array $plan): void
    {
        $creates = ['experiments' => 0, 'sources' => 0, 'sections' => 0, 'publications' => 0, 'media' => 0, 'metrics' => 0];
        $updates = ['experiments' => 0];
        foreach ($plan as $entry) {
            if ($entry['experiment']) {
                if ($this->hash($this->experimentFieldsFromModel($entry['experiment'])) !== $this->hash($entry['fields'])) {
                    $updates['experiments']++;
                }
            } else {
                $creates['experiments']++;
            }
            foreach (['source_plans' => 'sources', 'section_plans' => 'sections', 'publication_plans' => 'publications', 'media_plans' => 'media', 'metric_plans' => 'metrics'] as $key => $type) {
                foreach ($entry[$key] as $item) {
                    if (! $item['existing']) {
                        $creates[$type]++;
                    }
                }
            }
        }

        $this->table(
            ['Action', 'Experiments', 'Sources', 'Sections', 'Publications', 'Media', 'Metrics'],
            [
                ['Create', $creates['experiments'], $creates['sources'], $creates['sections'], $creates['publications'], $creates['media'], $creates['metrics']],
                ['Update', $updates['experiments'], 0, 0, 0, 0, 0],
                ['Skip (identical)', 0, $this->countExisting($plan, 'source_plans'), $this->countExisting($plan, 'section_plans'), $this->countExisting($plan, 'publication_plans'), $this->countExisting($plan, 'media_plans'), $this->countExisting($plan, 'metric_plans')],
            ],
        );
    }

    /**
     * @param  array<int, array<string, mixed>>  $plan
     */
    private function countExisting(array $plan, string $key): int
    {
        return array_sum(array_map(fn (array $entry): int => count(array_filter($entry[$key], fn (array $item): bool => (bool) $item['existing'])), $plan));
    }

    /**
     * @param  array<int, array<string, mixed>>  $plan
     */
    private function persistPlan(array $plan): void
    {
        foreach ($plan as $entry) {
            /** @var Experiment|null $experiment */
            $experiment = $entry['experiment'];
            $metadata = $experiment?->metadata ?? [];
            $metadata = is_array($metadata) ? $metadata : [];

            $fields = $entry['fields'];
            if (! $experiment) {
                $experiment = new Experiment;
                $experiment->catalog_key = $entry['record']['catalog_key'];
            }

            $experiment->fill($fields);
            $experiment->save();
            $managedItems = [];

            foreach ($entry['source_plans'] as $itemPlan) {
                $model = $this->persistChild($experiment, $itemPlan);
                $managedItems[$itemPlan['tracking_key']] = ['id' => $model->id, 'hash' => $this->hash($this->modelPayload($model))];
            }
            foreach ($entry['section_plans'] as $itemPlan) {
                $model = $this->persistChild($experiment, $itemPlan);
                $managedItems[$itemPlan['tracking_key']] = ['id' => $model->id, 'hash' => $this->hash($this->modelPayload($model))];
            }
            foreach ($entry['publication_plans'] as $itemPlan) {
                $model = $this->persistChild($experiment, $itemPlan);
                $managedItems[$itemPlan['tracking_key']] = ['id' => $model->id, 'hash' => $this->hash($this->modelPayload($model))];
            }
            foreach ($entry['media_plans'] as $itemPlan) {
                $model = $this->persistChild($experiment, $itemPlan);
                $managedItems[$itemPlan['tracking_key']] = ['id' => $model->id, 'hash' => $this->hash($this->modelPayload($model))];
            }
            foreach ($entry['metric_plans'] as $itemPlan) {
                $model = $this->persistChild($experiment, $itemPlan);
                $managedItems[$itemPlan['tracking_key']] = ['id' => $model->id, 'hash' => $this->hash($this->modelPayload($model))];
            }

            $metadata[self::MANAGED_METADATA_KEY] = [
                'fields_hash' => $this->hash($fields),
                'items' => $managedItems,
            ];
            $experiment->metadata = $metadata;
            $experiment->save();
        }
    }

    /**
     * @param  array<string, mixed>  $plan
     */
    private function persistChild(Experiment $experiment, array $plan): Model
    {
        $model = $plan['existing'] ?? match ($plan['model']) {
            Source::class => $experiment->sources()->make(),
            ExperimentSection::class => $experiment->sections()->make(),
            Publication::class => $experiment->publications()->make(),
            Media::class => $experiment->media()->make(),
            ExperimentMetric::class => $experiment->metrics()->make(),
            default => throw new \InvalidArgumentException("Unsupported catalog model {$plan['model']}."),
        };
        $values = $plan['values'];
        if (isset($plan['item']['source_url']) && ($model instanceof Media || $model instanceof ExperimentSection || $model instanceof ExperimentMetric)) {
            $source = $experiment->sources()->where('source_url', $plan['item']['source_url'])->first();
            $values['source_id'] = $source?->id;
        }
        $model->fill($values);
        $model->save();

        return $model;
    }

    /**
     * @param  array<string, mixed>  $values
     */
    private function hash(array $values): string
    {
        ksort($values);

        return hash('sha256', json_encode($values, JSON_THROW_ON_ERROR | JSON_UNESCAPED_SLASHES | JSON_UNESCAPED_UNICODE));
    }

    private function normalizeMetricValue(mixed $value): ?string
    {
        if ($value === null) {
            return null;
        }

        if (! preg_match('/^(-?)(\d{1,18})(?:\.(\d{1,12}))?$/', (string) $value, $matches)) {
            throw ValidationException::withMessages(['metric_value' => 'Metric values must fit DECIMAL(30,12) without implicit rounding.']);
        }

        $integer = ltrim($matches[2], '0') ?: '0';
        $fraction = str_pad($matches[3] ?? '', 12, '0');
        $sign = $matches[1] === '-' && ($integer !== '0' || trim($fraction, '0') !== '') ? '-' : '';

        return $sign.$integer.'.'.$fraction;
    }
}
