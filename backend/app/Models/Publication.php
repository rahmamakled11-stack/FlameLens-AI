<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class Publication extends Model
{
    protected $fillable = [
        'experiment_id',
        'title',
        'authors',
        'publication_type',
        'journal',
        'doi',
        'publication_url',
        'publication_date',
        'abstract',
    ];

    protected function casts(): array
    {
        return [
            'authors' => 'array',
            'publication_date' => 'date',
        ];
    }

    public function experiment(): BelongsTo
    {
        return $this->belongsTo(Experiment::class);
    }
}
