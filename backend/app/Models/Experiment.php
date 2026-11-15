<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\HasMany;

class Experiment extends Model
{
    protected $fillable = [
        'catalog_key',
        'nasa_identifier',
        'title',
        'acronym',
        'program',
        'mission',
        'summary',
        'description',
        'nasa_url',
        'metadata',
    ];

    protected function casts(): array
    {
        return [
            'metadata' => 'array',
        ];
    }

    public function sources(): HasMany
    {
        return $this->hasMany(Source::class);
    }

    public function publications(): HasMany
    {
        return $this->hasMany(Publication::class);
    }

    public function media(): HasMany
    {
        return $this->hasMany(Media::class);
    }

    public function sections(): HasMany
    {
        return $this->hasMany(ExperimentSection::class);
    }

    public function metrics(): HasMany
    {
        return $this->hasMany(ExperimentMetric::class);
    }
}
