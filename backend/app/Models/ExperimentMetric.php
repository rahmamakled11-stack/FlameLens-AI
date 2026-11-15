<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class ExperimentMetric extends Model
{
    protected $fillable = [
        'experiment_id',
        'metric_name',
        'metric_value',
        'unit',
        'conditions',
        'source_id',
    ];

    protected function casts(): array
    {
        return [
            'metric_value' => 'decimal:12',
            'conditions' => 'array',
        ];
    }

    public function experiment(): BelongsTo
    {
        return $this->belongsTo(Experiment::class);
    }

    public function source(): BelongsTo
    {
        return $this->belongsTo(Source::class);
    }
}
