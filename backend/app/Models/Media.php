<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class Media extends Model
{
    protected $fillable = [
        'experiment_id',
        'title',
        'description',
        'media_type',
        'media_url',
        'thumbnail_url',
        'source_id',
        'metadata',
    ];

    protected function casts(): array
    {
        return [
            'metadata' => 'array',
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
