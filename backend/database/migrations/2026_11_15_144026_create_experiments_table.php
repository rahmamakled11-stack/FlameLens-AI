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
        Schema::create('experiments', function (Blueprint $table) {
            $table->id();
            // NASA identification
            $table->string('nasa_identifier')->nullable()->unique();

            // Basic information
            $table->string('title');
            $table->string('acronym')->nullable();
            $table->string('program')->nullable();
            $table->string('mission')->nullable();

            // Experiment description
            $table->text('summary')->nullable();
            $table->longText('description')->nullable();

            // Original NASA page
            $table->text('nasa_url')->nullable();

            // Additional source-specific information
            $table->json('metadata')->nullable();
            $table->timestamps();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('experiments');
    }
};
