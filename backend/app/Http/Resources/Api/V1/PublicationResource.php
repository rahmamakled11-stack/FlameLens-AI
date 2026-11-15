<?php

namespace App\Http\Resources\Api\V1;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class PublicationResource extends JsonResource
{
    public function toArray(Request $request): array
    {
        return [
            'id' => (string) $this->id,
            'title' => $this->title,
            'authors' => $this->authors,
            'publication_type' => $this->publication_type,
            'journal' => $this->journal,
            'doi' => $this->doi,
            'publication_url' => $this->publication_url,
            'publication_date' => $this->publication_date?->toDateString(),
            'abstract' => $this->abstract,
        ];
    }
}
