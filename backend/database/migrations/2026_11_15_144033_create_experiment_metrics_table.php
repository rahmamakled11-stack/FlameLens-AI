<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        Schema::create('experiment_metrics', function (Blueprint $table) {
            $table->id();
            $table->foreignId('experiment_id')->constrained()->cascadeOnDelete();
            $table->string('metric_name')->index();
            $table->decimal('metric_value', 30, 12)->nullable();
            $table->string('unit')->nullable();
            $table->json('conditions')->nullable();
            $table->foreignId('source_id')->nullable()->constrained()->nullOnDelete();
            $table->timestamps();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('experiment_metrics');
    }
};
