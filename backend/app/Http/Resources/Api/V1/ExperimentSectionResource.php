<?php

namespace App\Http\Resources\Api\V1;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class ExperimentSectionResource extends JsonResource
{
    public function toArray(Request $request): array
    {
        return [
            'id' => (string) $this->id,
            'section_type' => $this->section_type,
            'title' => $this->title,
            'content' => $this->content,
            'display_order' => $this->display_order,
            'source' => $this->source ? new SourceResource($this->source) : null,
        ];
    }
}
