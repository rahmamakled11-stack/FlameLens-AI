<?php

namespace Tests\Feature;

use App\Models\Experiment;
use App\Models\ExperimentMetric;
use App\Models\ExperimentSection;
use App\Models\Media;
use App\Models\Publication;
use App\Models\Source;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class ExperimentApiTest extends TestCase
{
    use RefreshDatabase;

    public function test_experiment_listing_returns_public_fields_counts_and_source_provenance(): void
    {
        $experiment = Experiment::query()->create([
            'catalog_key' => 'internal:private-key',
            'nasa_identifier' => null,
            'title' => 'Combustion Alpha',
            'program' => 'Combustion Science',
            'metadata' => ['flamelens_catalog_import' => ['fingerprint' => 'private']],
        ]);
        Source::query()->create([
            'experiment_id' => $experiment->id,
            'title' => 'Official research record',
            'source_type' => 'NASA',
            'source_url' => 'https://nasa.gov/research/alpha',
        ]);
        Publication::query()->create(['experiment_id' => $experiment->id, 'title' => 'Paper']);
        Media::query()->create([
            'experiment_id' => $experiment->id,
            'title' => 'Media item',
            'media_type' => 'image',
            'media_url' => 'https://nasa.gov/media/alpha',
        ]);
        ExperimentMetric::query()->create([
            'experiment_id' => $experiment->id,
            'metric_name' => 'Burn duration',
            'metric_value' => null,
        ]);

        $response = $this->getJson('/api/v1/experiments');

        $response->assertOk()
            ->assertJsonPath('data.0.id', (string) $experiment->id)
            ->assertJsonPath('data.0.nasa_identifier', null)
            ->assertJsonPath('data.0.sources.0.source_url', 'https://nasa.gov/research/alpha')
            ->assertJsonPath('data.0.source_count', 1)
            ->assertJsonPath('data.0.publication_count', 1)
            ->assertJsonPath('data.0.media_count', 1)
            ->assertJsonPath('data.0.metric_count', 1)
            ->assertJsonMissingPath('data.0.catalog_key')
            ->assertJsonMissingPath('data.0.metadata');
    }

    public function test_experiment_listing_is_paginated_and_defaults_to_nine_sorted_by_title(): void
    {
        foreach (range(10, 1) as $number) {
            Experiment::query()->create(['title' => sprintf('Experiment %02d', $number)]);
        }

        $response = $this->getJson('/api/v1/experiments');

        $response->assertOk()
            ->assertJsonCount(9, 'data')
            ->assertJsonPath('data.0.title', 'Experiment 01')
            ->assertJsonPath('meta.current_page', 1)
            ->assertJsonPath('meta.per_page', 9)
            ->assertJsonPath('meta.total', 10)
            ->assertJsonPath('meta.last_page', 2)
            ->assertJsonPath('links.next', fn (?string $value): bool => $value !== null);
    }

    public function test_experiment_listing_supports_search_program_mission_and_documented_sorting(): void
    {
        Experiment::query()->create([
            'title' => 'Zulu Test Flame',
            'program' => 'Program A',
            'mission' => 'Mission 1',
        ]);
        Experiment::query()->create([
            'title' => 'Alpha Test Flame',
            'program' => 'Program A',
            'mission' => 'Mission 2',
        ]);
        Experiment::query()->create([
            'title' => 'Test Ignition',
            'program' => 'Program B',
            'mission' => 'Mission 1',
        ]);

        $this->getJson('/api/v1/experiments?q=Test&program=Program%20A&mission=Mission%202&direction=desc')
            ->assertOk()
            ->assertJsonCount(1, 'data')
            ->assertJsonPath('data.0.title', 'Alpha Test Flame');
    }

    public function test_experiment_listing_accepts_per_page_up_to_one_hundred_and_honors_descending_sort(): void
    {
        Experiment::query()->create(['title' => 'Alpha']);
        Experiment::query()->create(['title' => 'Zulu']);

        $this->getJson('/api/v1/experiments?per_page=100&page=1&sort=title&direction=desc')
            ->assertOk()
            ->assertJsonPath('meta.per_page', 100)
            ->assertJsonPath('data.0.title', 'Zulu')
            ->assertJsonPath('meta.total', 2);
    }

    public function test_experiment_search_uses_supported_experiment_fields_not_source_titles(): void
    {
        $experiment = Experiment::query()->create([
            'title' => 'Unrelated title',
            'acronym' => 'MICRO',
            'summary' => 'A verified summary',
            'description' => 'Detailed study text',
        ]);
        $sourceOnlyMatch = Experiment::query()->create(['title' => 'Other record']);
        Source::query()->create([
            'experiment_id' => $sourceOnlyMatch->id,
            'title' => 'Needle in source title',
            'source_type' => 'NASA',
            'source_url' => 'https://nasa.gov/source',
        ]);

        $this->getJson('/api/v1/experiments?q=MICRO')
            ->assertOk()
            ->assertJsonCount(1, 'data')
            ->assertJsonPath('data.0.id', (string) $experiment->id);

        $this->getJson('/api/v1/experiments?q=Needle')
            ->assertOk()
            ->assertJsonPath('data', []);
    }

    public function test_experiment_listing_returns_empty_paginated_data_when_catalog_is_empty(): void
    {
        $this->getJson('/api/v1/experiments')
            ->assertOk()
            ->assertExactJsonStructure([
                'data' => [],
                'links' => ['first', 'last', 'prev', 'next'],
                'meta' => ['current_page', 'from', 'last_page', 'per_page', 'to', 'total'],
            ])
            ->assertJsonPath('meta.total', 0)
            ->assertJsonPath('meta.from', null)
            ->assertJsonPath('meta.to', null);
    }

    public function test_invalid_and_unsupported_query_parameters_use_the_api_error_envelope(): void
    {
        $response = $this->getJson('/api/v1/experiments?per_page=101&sort=created_at&category=Combustion&availability=available');

        $response->assertUnprocessable()
            ->assertJsonPath('error.code', 'VALIDATION_FAILED')
            ->assertJsonPath('error.message', 'The request is invalid.')
            ->assertJsonStructure(['error' => ['code', 'message', 'details', 'request_id']])
            ->assertJsonMissingPath('data');

        $this->assertNotEmpty($response->json('error.details.per_page'));
        $this->assertNotEmpty($response->json('error.details.sort'));
        $this->assertNotEmpty($response->json('error.details.category'));
        $this->assertNotEmpty($response->json('error.details.availability'));
        $this->assertSame($response->json('error.request_id'), $response->headers->get('X-Request-ID'));
    }

    public function test_experiment_detail_returns_related_records_provenance_and_null_metric_values(): void
    {
        $experiment = Experiment::query()->create([
            'catalog_key' => 'internal:detail-key',
            'nasa_identifier' => null,
            'title' => 'Detailed Experiment',
            'metadata' => ['private' => 'internal'],
        ]);
        $source = Source::query()->create([
            'experiment_id' => $experiment->id,
            'title' => 'Original source',
            'source_type' => 'NASA NTRS',
            'source_url' => 'https://ntrs.nasa.gov/citations/123',
            'publisher' => 'NASA',
            'publication_date' => '2025-02-03',
            'accessed_at' => '2026-11-15 12:00:00',
        ]);
        ExperimentSection::query()->create([
            'experiment_id' => $experiment->id,
            'section_type' => 'overview',
            'title' => 'Overview',
            'content' => 'Verified overview text.',
            'display_order' => 1,
            'source_id' => $source->id,
        ]);
        Publication::query()->create([
            'experiment_id' => $experiment->id,
            'title' => 'Verified publication',
            'authors' => ['NASA researcher'],
            'publication_url' => 'https://ntrs.nasa.gov/citations/123',
        ]);
        Media::query()->create([
            'experiment_id' => $experiment->id,
            'source_id' => $source->id,
            'title' => 'Experiment image',
            'media_type' => 'image',
            'media_url' => 'https://images.nasa.gov/image/123',
        ]);
        ExperimentMetric::query()->create([
            'experiment_id' => $experiment->id,
            'source_id' => $source->id,
            'metric_name' => 'Temperature',
            'metric_value' => null,
            'unit' => 'K',
            'conditions' => null,
        ]);

        $response = $this->getJson('/api/v1/experiments/'.$experiment->id);

        $response->assertOk()
            ->assertJsonPath('data.id', (string) $experiment->id)
            ->assertJsonPath('data.nasa_identifier', null)
            ->assertJsonPath('data.sections.0.source.source_url', 'https://ntrs.nasa.gov/citations/123')
            ->assertJsonPath('data.sources.0.accessed_at', '2026-11-15T12:00:00.000000Z')
            ->assertJsonPath('data.publications.0.publication_url', 'https://ntrs.nasa.gov/citations/123')
            ->assertJsonPath('data.media.0.source.source_url', 'https://ntrs.nasa.gov/citations/123')
            ->assertJsonPath('data.metrics.0.metric_value', null)
            ->assertJsonPath('data.metrics.0.unit', 'K')
            ->assertJsonPath('data.metrics.0.conditions', null)
            ->assertJsonMissingPath('data.catalog_key')
            ->assertJsonMissingPath('data.metadata');
    }

    public function test_experiment_detail_returns_empty_arrays_for_missing_relationships_and_preserves_nulls(): void
    {
        $experiment = Experiment::query()->create([
            'title' => 'No related data',
            'nasa_identifier' => null,
            'summary' => null,
        ]);

        $this->getJson('/api/v1/experiments/'.$experiment->id)
            ->assertOk()
            ->assertJsonPath('data.nasa_identifier', null)
            ->assertJsonPath('data.summary', null)
            ->assertJsonPath('data.sections', [])
            ->assertJsonPath('data.sources', [])
            ->assertJsonPath('data.publications', [])
            ->assertJsonPath('data.media', [])
            ->assertJsonPath('data.metrics', []);
    }

    public function test_missing_experiment_id_returns_documented_not_found_error(): void
    {
        $response = $this->getJson('/api/v1/experiments/999999');

        $response->assertNotFound()
            ->assertJsonPath('error.code', 'RESOURCE_NOT_FOUND')
            ->assertJsonPath('error.message', 'The requested resource was not found.')
            ->assertJsonPath('error.details', [])
            ->assertJsonStructure(['error' => ['code', 'message', 'details', 'request_id']]);
    }

    public function test_dashboard_summary_returns_database_counts_and_null_research_areas(): void
    {
        $experiment = Experiment::query()->create(['title' => 'Dashboard experiment']);
        Experiment::query()->create(['title' => 'Another experiment']);
        Source::query()->create([
            'experiment_id' => $experiment->id,
            'title' => 'Source one',
            'source_type' => 'NASA',
            'source_url' => 'https://nasa.gov/source/one',
        ]);
        Source::query()->create([
            'title' => 'Unlinked source',
            'source_type' => 'NASA',
            'source_url' => 'https://nasa.gov/source/two',
        ]);
        Publication::query()->create(['experiment_id' => $experiment->id, 'title' => 'Paper one']);
        Publication::query()->create(['experiment_id' => $experiment->id, 'title' => 'Paper two']);

        $this->getJson('/api/v1/dashboard/summary')
            ->assertOk()
            ->assertJsonPath('data.research_papers', 2)
            ->assertJsonPath('data.experiments', 2)
            ->assertJsonPath('data.research_areas', null)
            ->assertJsonPath('data.data_sources', 2)
            ->assertJsonStructure(['data' => ['research_papers', 'experiments', 'research_areas', 'data_sources'], 'meta' => ['generated_at']]);
    }

    public function test_dashboard_summary_returns_zero_counts_for_empty_tables(): void
    {
        $this->getJson('/api/v1/dashboard/summary')
            ->assertOk()
            ->assertJsonPath('data.research_papers', 0)
            ->assertJsonPath('data.experiments', 0)
            ->assertJsonPath('data.research_areas', null)
            ->assertJsonPath('data.data_sources', 0);
    }
}
