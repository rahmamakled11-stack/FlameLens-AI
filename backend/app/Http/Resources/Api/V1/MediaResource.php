<?php

namespace App\Http\Resources\Api\V1;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class MediaResource extends JsonResource
{
    public function toArray(Request $request): array
    {
        return [
            'id' => (string) $this->id,
            'title' => $this->title,
            'description' => $this->description,
            'media_type' => $this->media_type,
            'media_url' => $this->media_url,
            'thumbnail_url' => $this->thumbnail_url,
            'source' => $this->source ? new SourceResource($this->source) : null,
        ];
    }
}
