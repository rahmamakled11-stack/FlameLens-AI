<?php

namespace App\Http\Controllers\Api\V1;

use App\Http\Controllers\Controller;
use App\Http\Requests\Api\V1\ListExperimentsRequest;
use App\Http\Requests\Api\V1\NoQueryParametersRequest;
use App\Http\Resources\Api\V1\ExperimentDetailResource;
use App\Http\Resources\Api\V1\ExperimentListResource;
use App\Models\Experiment;
use Illuminate\Database\Eloquent\Builder;
use Illuminate\Database\Eloquent\Relations\Relation;
use Illuminate\Http\JsonResponse;

class ExperimentController extends Controller
{
    public function index(ListExperimentsRequest $request): JsonResponse
    {
        $filters = $request->validated();
        $direction = $filters['direction'] ?? 'asc';

        $experiments = Experiment::query()
            ->select([
                'id',
                'nasa_identifier',
                'title',
                'acronym',
                'program',
                'mission',
                'summary',
                'description',
                'nasa_url',
            ])
            ->with(['sources' => fn (Relation $query) => $query->select([
                'id',
                'experiment_id',
                'title',
                'source_type',
                'source_url',
            ])])
            ->withCount(['sources', 'publications', 'media', 'metrics'])
            ->when(isset($filters['q']), function (Builder $query) use ($filters): void {
                $search = $filters['q'];
                $query->where(function (Builder $searchQuery) use ($search): void {
                    foreach (['title', 'acronym', 'summary', 'description'] as $column) {
                        $searchQuery->orWhere($column, 'like', '%'.$search.'%');
                    }
                });
            })
            ->when(isset($filters['program']), fn (Builder $query) => $query->where('program', $filters['program']))
            ->when(isset($filters['mission']), fn (Builder $query) => $query->where('mission', $filters['mission']))
            ->orderBy('title', $direction)
            ->orderBy('id')
            ->paginate((int) ($filters['per_page'] ?? 9))
            ->withQueryString();

        $data = ExperimentListResource::collection($experiments->getCollection())->resolve($request);

        return response()->json([
            'data' => $data,
            'links' => [
                'first' => $experiments->url(1),
                'last' => $experiments->url($experiments->lastPage()),
                'prev' => $experiments->previousPageUrl(),
                'next' => $experiments->nextPageUrl(),
            ],
            'meta' => [
                'current_page' => $experiments->currentPage(),
                'from' => $experiments->firstItem(),
                'last_page' => $experiments->lastPage(),
                'per_page' => $experiments->perPage(),
                'to' => $experiments->lastItem(),
                'total' => $experiments->total(),
            ],
        ]);
    }

    public function show(NoQueryParametersRequest $request, string $id): ExperimentDetailResource
    {
        $experiment = Experiment::query()
            ->with([
                'sections' => fn (Relation $query) => $query
                    ->with('source')
                    ->orderBy('display_order')
                    ->orderBy('id'),
                'sources' => fn (Relation $query) => $query->orderBy('id'),
                'publications' => fn (Relation $query) => $query->orderBy('id'),
                'media' => fn (Relation $query) => $query
                    ->with('source')
                    ->orderBy('id'),
                'metrics' => fn (Relation $query) => $query
                    ->with('source')
                    ->orderBy('id'),
            ])
            ->findOrFail($id);

        return new ExperimentDetailResource($experiment);
    }
}
