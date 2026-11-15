<?php

namespace App\Http\Resources\Api\V1;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class ExperimentDetailResource extends JsonResource
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
            'sections' => ExperimentSectionResource::collection($this->sections),
            'sources' => SourceResource::collection($this->sources),
            'publications' => PublicationResource::collection($this->publications),
            'media' => MediaResource::collection($this->media),
            'metrics' => ExperimentMetricResource::collection($this->metrics),
        ];
    }
}
