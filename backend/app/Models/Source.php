<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class Source extends Model
{
    protected $fillable = [
        'experiment_id',
        'title',
        'source_type',
        'source_url',
        'publisher',
        'publication_date',
        'accessed_at',
        'metadata',
    ];

    protected function casts(): array
    {
        return [
            'publication_date' => 'date',
            'accessed_at' => 'datetime',
            'metadata' => 'array',
        ];
    }

    public function experiment(): BelongsTo
    {
        return $this->belongsTo(Experiment::class);
    }
}
