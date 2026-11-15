<?php

use App\Support\ApiErrorResponse;
use Illuminate\Foundation\Application;
use Illuminate\Foundation\Configuration\Exceptions;
use Illuminate\Foundation\Configuration\Middleware;
use Illuminate\Http\Request;
use Illuminate\Validation\ValidationException;
use Symfony\Component\HttpKernel\Exception\HttpExceptionInterface;

return Application::configure(basePath: dirname(__DIR__))
    ->withRouting(
        web: __DIR__.'/../routes/web.php',
        api: __DIR__.'/../routes/api.php',
        apiPrefix: 'api/v1',
        commands: __DIR__.'/../routes/console.php',
        health: '/up',
    )
    ->withMiddleware(function (Middleware $middleware): void {
        //
    })
    ->withExceptions(function (Exceptions $exceptions): void {
        $exceptions->render(function (ValidationException $exception, Request $request) {
            if (! $request->is('api/v1/*')) {
                return null;
            }

            return ApiErrorResponse::make(
                'VALIDATION_FAILED',
                'The request is invalid.',
                $exception->errors(),
                422,
            );
        });

        $exceptions->render(function (HttpExceptionInterface $exception, Request $request) {
            if (! $request->is('api/v1/*')) {
                return null;
            }

            $status = $exception->getStatusCode();

            return ApiErrorResponse::make(
                $status === 404 ? 'RESOURCE_NOT_FOUND' : ($status === 422 ? 'VALIDATION_FAILED' : 'HTTP_ERROR'),
                match ($status) {
                    400 => 'The request is invalid.',
                    404 => 'The requested resource was not found.',
                    413 => 'The request body is too large.',
                    422 => 'The request is invalid.',
                    429 => 'Too many requests.',
                    503 => 'A required service is unavailable.',
                    default => 'The request could not be completed.',
                },
                [],
                $status,
            );
        });

        $exceptions->render(function (Throwable $exception, Request $request) {
            if (! $request->is('api/v1/*')) {
                return null;
            }

            return ApiErrorResponse::make(
                'INTERNAL_SERVER_ERROR',
                'An unexpected server error occurred.',
                [],
                500,
            );
        });
    })->create();
