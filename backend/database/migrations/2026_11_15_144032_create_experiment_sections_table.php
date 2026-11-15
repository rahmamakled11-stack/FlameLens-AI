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
        Schema::create('experiment_sections', function (Blueprint $table) {
            $table->id();
            $table->foreignId('experiment_id')->constrained()->cascadeOnDelete();
            $table->string('section_type')->index();
            $table->string('title');
            $table->longText('content')->nullable();
            $table->unsignedInteger('display_order')->default(0);
            $table->foreignId('source_id')->nullable()->constrained()->nullOnDelete();
            $table->timestamps();

            $table->index(['experiment_id', 'display_order']);
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('experiment_sections');
    }
};
