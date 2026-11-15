<?php

namespace App\Http\Resources\Api\V1;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class ExperimentMetricResource extends JsonResource
{
    public function toArray(Request $request): array
    {
        return [
            'id' => (string) $this->id,
            'metric_name' => $this->metric_name,
            'metric_value' => $this->metric_value,
            'unit' => $this->unit,
            'conditions' => $this->conditions,
            'source' => $this->source ? new SourceResource($this->source) : null,
        ];
    }
}
