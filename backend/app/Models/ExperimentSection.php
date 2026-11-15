<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class ExperimentSection extends Model
{
    protected $fillable = [
        'experiment_id',
        'section_type',
        'title',
        'content',
        'display_order',
        'source_id',
    ];

    protected function casts(): array
    {
        return [
            'display_order' => 'integer',
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
