<?php

namespace Tests\Feature;

use App\Models\Experiment;
use App\Models\ExperimentMetric;
use App\Models\ExperimentSection;
use App\Models\Media;
use App\Models\Publication;
use App\Models\Source;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Schema;
use Tests\TestCase;

class BackendArchitectureTest extends TestCase
{
    use RefreshDatabase;

    public function test_versioned_api_status_route_returns_json(): void
    {
        $this->getJson('/api/v1/status')
            ->assertOk()
            ->assertExactJson(['status' => 'ok']);
    }

    public function test_domain_tables_have_the_expected_schema(): void
    {
        $this->assertTrue(Schema::hasColumns('experiments', [
            'catalog_key', 'nasa_identifier', 'title', 'acronym', 'program', 'mission',
            'summary', 'description', 'nasa_url', 'metadata',
        ]));
        $this->assertTrue(Schema::hasColumns('sources', [
            'experiment_id', 'title', 'source_type', 'source_url', 'publisher',
            'publication_date', 'accessed_at', 'metadata',
        ]));
        $this->assertTrue(Schema::hasColumns('publications', [
            'experiment_id', 'title', 'authors', 'publication_type', 'journal',
            'doi', 'publication_url', 'publication_date', 'abstract',
        ]));
        $this->assertTrue(Schema::hasColumns('media', [
            'experiment_id', 'title', 'description', 'media_type', 'media_url',
            'thumbnail_url', 'source_id', 'metadata',
        ]));
        $this->assertTrue(Schema::hasColumns('experiment_sections', [
            'experiment_id', 'section_type', 'title', 'content', 'display_order',
            'source_id',
        ]));
        $this->assertTrue(Schema::hasColumns('experiment_metrics', [
            'experiment_id', 'metric_name', 'metric_value', 'unit', 'conditions',
            'source_id',
        ]));
    }

    public function test_models_expose_the_expected_relationships(): void
    {
        $experiment = new Experiment;

        $this->assertInstanceOf(HasMany::class, $experiment->sources());
        $this->assertInstanceOf(HasMany::class, $experiment->publications());
        $this->assertInstanceOf(HasMany::class, $experiment->media());
        $this->assertInstanceOf(HasMany::class, $experiment->sections());
        $this->assertInstanceOf(HasMany::class, $experiment->metrics());

        foreach ([new Source, new Publication, new Media, new ExperimentSection, new ExperimentMetric] as $model) {
            $this->assertInstanceOf(BelongsTo::class, $model->experiment());
        }

        $this->assertInstanceOf(BelongsTo::class, (new Media)->source());
        $this->assertInstanceOf(BelongsTo::class, (new ExperimentSection)->source());
        $this->assertInstanceOf(BelongsTo::class, (new ExperimentMetric)->source());
    }

    public function test_deletion_rules_preserve_sources_and_clear_optional_links(): void
    {
        $experiment = Experiment::query()->create(['title' => 'Test experiment']);
        $source = Source::query()->create([
            'experiment_id' => $experiment->id,
            'title' => 'Test source',
            'source_type' => 'test',
            'source_url' => 'https://example.test/source',
        ]);
        $publication = Publication::query()->create([
            'experiment_id' => $experiment->id,
            'title' => 'Test publication',
        ]);
        $media = Media::query()->create([
            'experiment_id' => $experiment->id,
            'source_id' => $source->id,
            'title' => 'Test media',
            'media_type' => 'test',
            'media_url' => 'https://example.test/media',
        ]);
        $section = ExperimentSection::query()->create([
            'experiment_id' => $experiment->id,
            'source_id' => $source->id,
            'section_type' => 'test',
            'title' => 'Test section',
        ]);
        $metric = ExperimentMetric::query()->create([
            'experiment_id' => $experiment->id,
            'source_id' => $source->id,
            'metric_name' => 'Test metric',
            'metric_value' => null,
        ]);

        $this->assertDatabaseHas('experiment_metrics', [
            'id' => $metric->id,
            'metric_value' => null,
        ]);

        $experiment->delete();

        $this->assertDatabaseHas('sources', [
            'id' => $source->id,
            'experiment_id' => null,
        ]);
        $this->assertDatabaseMissing('publications', ['id' => $publication->id]);
        $this->assertDatabaseMissing('media', ['id' => $media->id]);
        $this->assertDatabaseMissing('experiment_sections', ['id' => $section->id]);
        $this->assertDatabaseMissing('experiment_metrics', ['id' => $metric->id]);

        $secondExperiment = Experiment::query()->create(['title' => 'Second test experiment']);
        $secondSource = Source::query()->create([
            'experiment_id' => $secondExperiment->id,
            'title' => 'Second test source',
            'source_type' => 'test',
            'source_url' => 'https://example.test/second-source',
        ]);
        $linkedMedia = Media::query()->create([
            'experiment_id' => $secondExperiment->id,
            'source_id' => $secondSource->id,
            'title' => 'Linked test media',
            'media_type' => 'test',
            'media_url' => 'https://example.test/linked-media',
        ]);
        $linkedSection = ExperimentSection::query()->create([
            'experiment_id' => $secondExperiment->id,
            'source_id' => $secondSource->id,
            'section_type' => 'test',
            'title' => 'Linked test section',
        ]);
        $linkedMetric = ExperimentMetric::query()->create([
            'experiment_id' => $secondExperiment->id,
            'source_id' => $secondSource->id,
            'metric_name' => 'Linked test metric',
        ]);

        $secondSource->delete();

        $this->assertDatabaseHas('media', ['id' => $linkedMedia->id, 'source_id' => null]);
        $this->assertDatabaseHas('experiment_sections', ['id' => $linkedSection->id, 'source_id' => null]);
        $this->assertDatabaseHas('experiment_metrics', ['id' => $linkedMetric->id, 'source_id' => null]);
    }
}
