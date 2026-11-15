<?php

namespace App\Http\Controllers\Api\V1;

use App\Http\Controllers\Controller;
use App\Http\Requests\Api\V1\NoQueryParametersRequest;
use App\Models\Experiment;
use App\Models\Publication;
use App\Models\Source;
use Illuminate\Http\JsonResponse;

class DashboardSummaryController extends Controller
{
    public function __invoke(NoQueryParametersRequest $request): JsonResponse
    {
        return response()->json([
            'data' => [
                'research_papers' => Publication::query()->count(),
                'experiments' => Experiment::query()->count(),
                'research_areas' => null,
                'data_sources' => Source::query()->count(),
            ],
            'meta' => [
                'generated_at' => now()->utc()->toISOString(),
            ],
        ]);
    }
}
