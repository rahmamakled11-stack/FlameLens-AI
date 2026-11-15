<?php

use App\Http\Controllers\Api\V1\DashboardSummaryController;
use App\Http\Controllers\Api\V1\ExperimentController;
use Illuminate\Support\Facades\Route;

Route::get('/status', fn () => response()->json(['status' => 'ok']))
    ->name('status');

Route::get('/experiments', [ExperimentController::class, 'index'])
    ->name('experiments.index');
Route::get('/experiments/{id}', [ExperimentController::class, 'show'])
    ->whereNumber('id')
    ->name('experiments.show');
Route::get('/dashboard/summary', DashboardSummaryController::class)
    ->name('dashboard.summary');
