<?php

namespace App\Support;

use Illuminate\Http\JsonResponse;
use Illuminate\Support\Str;

class ApiErrorResponse
{
    /**
     * @param  array<string, array<int, string>>  $details
     */
    public static function make(
        string $code,
        string $message,
        array $details,
        int $status,
    ): JsonResponse {
        $requestId = (string) Str::uuid();

        return response()->json([
            'error' => [
                'code' => $code,
                'message' => $message,
                'details' => (object) $details,
                'request_id' => $requestId,
            ],
        ], $status)->header('X-Request-ID', $requestId);
    }
}
