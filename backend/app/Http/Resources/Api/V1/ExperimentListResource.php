<?php

namespace App\Http\Resources\Api\V1;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class ExperimentListResource extends JsonResource
{
    public function toArray(Request $request): array
    {
        return [
            'id' => (string) $this->id,
            'title' => $this->title,
            'acronym' => $this->acronym,
            'nasa_identifier' => $this->nasa_identifier,
            'program' => $this->program,
            'mission' => $this->mission,
            'summary' => $this->summary,
            'description' => $this->description,
            'nasa_url' => $this->nasa_url,
            'sources' => ExperimentListSourceResource::collection($this->whenLoaded('sources')),
            'source_count' => (int) $this->sources_count,
            'publication_count' => (int) $this->publications_count,
            'media_count' => (int) $this->media_count,
            'metric_count' => (int) $this->metrics_count,
        ];
    }
}
