<?php

namespace Tests\Feature;

use App\Models\Experiment;
use App\Models\ExperimentSection;
use App\Models\Media;
use App\Models\Publication;
use App\Models\Source;
use Illuminate\Database\QueryException;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Schema;
use Tests\TestCase;

class NasaCatalogImportTest extends TestCase
{
    use RefreshDatabase;

    public function test_catalog_key_is_nullable_for_legacy_rows_and_persisted_for_catalog_records(): void
    {
        $this->assertTrue(Schema::hasColumn('experiments', 'catalog_key'));

        $legacy = Experiment::query()->create(['title' => 'Legacy record']);
        $this->assertNull($legacy->catalog_key);

        $this->artisan('flamelens:import-nasa-catalog', ['--commit' => true])
            ->expectsOutputToContain('Catalog import committed successfully.')
            ->assertSuccessful();

        $this->assertDatabaseHas('experiments', [
            'catalog_key' => 'nasa:combustion:acme',
            'nasa_identifier' => null,
        ]);
        $this->assertDatabaseCount('experiments', 9);
    }

    public function test_catalog_key_is_unique_but_nullable_for_existing_rows(): void
    {
        Experiment::query()->create(['title' => 'First legacy row']);
        Experiment::query()->create(['title' => 'Second legacy row']);
        Experiment::query()->create([
            'catalog_key' => 'nasa:combustion:acme',
            'title' => 'Catalog row',
        ]);

        $this->expectException(QueryException::class);
        Experiment::query()->create([
            'catalog_key' => 'nasa:combustion:acme',
            'title' => 'Duplicate catalog row',
        ]);
    }

    public function test_default_execution_is_a_dry_run(): void
    {
        $this->artisan('flamelens:import-nasa-catalog')
            ->expectsOutputToContain('Dry run only')
            ->assertSuccessful();

        $this->assertDatabaseCount('experiments', 0);
        $this->assertDatabaseCount('sources', 0);
    }

    public function test_repeated_import_is_idempotent_and_preserves_provenance_and_scopes(): void
    {
        $this->artisan('flamelens:import-nasa-catalog', ['--commit' => true])
            ->expectsOutputToContain('Catalog import committed successfully.')
            ->assertSuccessful();
        $counts = [
            'experiments' => Experiment::query()->count(),
            'sources' => Schema::hasTable('sources') ? Source::query()->count() : 0,
            'sections' => ExperimentSection::query()->count(),
            'publications' => Publication::query()->count(),
            'media' => Media::query()->count(),
        ];

        $this->artisan('flamelens:import-nasa-catalog', ['--commit' => true])
            ->expectsOutputToContain('Catalog import committed successfully.')
            ->assertSuccessful();

        $this->assertSame($counts['experiments'], Experiment::query()->count());
        $this->assertSame($counts['sources'], Source::query()->count());
        $this->assertSame($counts['sections'], ExperimentSection::query()->count());
        $this->assertSame($counts['publications'], Publication::query()->count());
        $this->assertSame($counts['media'], Media::query()->count());

        $same = Experiment::query()->where('catalog_key', 'nasa:combustion:same')->firstOrFail();
        $this->assertDatabaseHas('experiment_sections', [
            'experiment_id' => $same->id,
            'title' => 'SAME-2 particle results',
        ]);
        $this->assertDatabaseHas('publications', [
            'experiment_id' => $same->id,
            'title' => 'Particle Morphology and Size Results from the Smoke Aerosol Measurement Experiment-2',
        ]);
        $this->assertDatabaseHas('sources', [
            'experiment_id' => $same->id,
            'source_url' => 'https://ntrs.nasa.gov/citations/20130000422',
        ]);
        $sameSection = ExperimentSection::query()
            ->where('experiment_id', $same->id)
            ->where('title', 'SAME-2 particle results')
            ->firstOrFail();
        $this->assertSame(
            'https://ntrs.nasa.gov/citations/20130000422',
            $sameSection->source()->firstOrFail()->source_url,
        );

        $bass = Experiment::query()->where('catalog_key', 'nasa:combustion:bass')->firstOrFail();
        $this->assertDatabaseHas('experiment_sections', [
            'experiment_id' => $bass->id,
            'title' => 'BASS-II results scope',
        ]);
        $daft = Experiment::query()->where('catalog_key', 'nasa:combustion:daft')->firstOrFail();
        $this->assertNotSame($same->id, $daft->id);
        $this->assertDatabaseHas('experiment_sections', [
            'experiment_id' => $daft->id,
            'title' => 'Instrument feasibility',
        ]);

        $saffire = Experiment::query()->where('catalog_key', 'nasa:combustion:saffire')->firstOrFail();
        $this->assertDatabaseHas('media', [
            'experiment_id' => $saffire->id,
            'title' => 'Saffire-V Experiment January 2021',
        ]);

        $spice = Experiment::query()->where('catalog_key', 'nasa:combustion:spice')->firstOrFail();
        $this->assertDatabaseHas('experiment_sections', [
            'experiment_id' => $spice->id,
            'section_type' => 'objectives',
        ]);
        $this->assertDatabaseMissing('experiment_sections', [
            'experiment_id' => $spice->id,
            'section_type' => 'findings',
        ]);
        $this->assertDatabaseMissing('experiment_metrics', ['experiment_id' => $spice->id]);
        $this->assertArrayNotHasKey('status', $spice->metadata ?? []);
    }

    public function test_invalid_json_is_rejected_without_writes(): void
    {
        $path = tempnam(sys_get_temp_dir(), 'nasa-catalog-');
        if ($path === false) {
            $this->fail('Unable to allocate a temporary manifest path.');
        }

        try {
            file_put_contents($path, '{invalid');
            $this->artisan('flamelens:import-nasa-catalog', ['--file' => $path])
                ->assertExitCode(1);
        } finally {
            unlink($path);
        }

        $this->assertDatabaseCount('experiments', 0);
    }

    public function test_duplicate_catalog_keys_in_manifest_are_rejected(): void
    {
        $manifest = json_decode(file_get_contents(base_path('docs/verified_nasa_experiments.json')), true, 512, JSON_THROW_ON_ERROR);
        $manifest['experiments'][1]['catalog_key'] = $manifest['experiments'][0]['catalog_key'];
        $path = tempnam(sys_get_temp_dir(), 'nasa-catalog-');
        if ($path === false) {
            $this->fail('Unable to allocate a temporary manifest path.');
        }

        try {
            file_put_contents($path, json_encode($manifest, JSON_THROW_ON_ERROR));
            $this->artisan('flamelens:import-nasa-catalog', ['--file' => $path])
                ->assertExitCode(1);
        } finally {
            unlink($path);
        }

        $this->assertDatabaseCount('experiments', 0);
    }

    public function test_missing_catalog_key_is_rejected_before_writes(): void
    {
        $manifest = json_decode(file_get_contents(base_path('docs/verified_nasa_experiments.json')), true, 512, JSON_THROW_ON_ERROR);
        unset($manifest['experiments'][0]['catalog_key']);
        $path = tempnam(sys_get_temp_dir(), 'nasa-catalog-');
        if ($path === false) {
            $this->fail('Unable to allocate a temporary manifest path.');
        }

        try {
            file_put_contents($path, json_encode($manifest, JSON_THROW_ON_ERROR));
            $this->artisan('flamelens:import-nasa-catalog', ['--file' => $path])
                ->assertExitCode(1);
        } finally {
            unlink($path);
        }

        $this->assertDatabaseCount('experiments', 0);
    }

    public function test_unmanaged_existing_catalog_identity_is_a_conflict(): void
    {
        Experiment::query()->create([
            'catalog_key' => 'nasa:combustion:acme',
            'title' => 'Manually created record',
        ]);

        $this->artisan('flamelens:import-nasa-catalog')
            ->assertExitCode(1);

        $this->assertDatabaseCount('experiments', 1);
        $this->assertDatabaseCount('sources', 0);
    }

    public function test_changed_imported_child_is_a_conflict_without_duplicate_writes(): void
    {
        $this->artisan('flamelens:import-nasa-catalog', ['--commit' => true])->assertSuccessful();
        $section = ExperimentSection::query()->firstOrFail();
        $section->update(['content' => 'Manual edit']);
        $counts = [
            'experiments' => Experiment::query()->count(),
            'sources' => Source::query()->count(),
            'sections' => ExperimentSection::query()->count(),
        ];

        $this->artisan('flamelens:import-nasa-catalog')
            ->assertExitCode(1);

        $this->assertSame($counts['experiments'], Experiment::query()->count());
        $this->assertSame($counts['sources'], Source::query()->count());
        $this->assertSame($counts['sections'], ExperimentSection::query()->count());
        $this->assertDatabaseHas('experiment_sections', [
            'id' => $section->id,
            'content' => 'Manual edit',
        ]);
    }
}
