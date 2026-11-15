<?php

namespace App\Http\Resources\Api\V1;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class SourceResource extends JsonResource
{
    public function toArray(Request $request): array
    {
        return [
            'id' => (string) $this->id,
            'title' => $this->title,
            'source_type' => $this->source_type,
            'source_url' => $this->source_url,
            'publisher' => $this->publisher,
            'publication_date' => $this->publication_date?->toDateString(),
            'accessed_at' => $this->accessed_at?->utc()->toISOString(),
        ];
    }
}
