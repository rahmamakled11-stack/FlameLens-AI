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
        Schema::create('sources', function (Blueprint $table) {
            $table->id();
            $table->foreignId('experiment_id')->nullable()->constrained()->nullOnDelete();
            $table->string('title');
            $table->string('source_type')->index();
            $table->text('source_url');
            $table->string('publisher')->nullable();
            $table->date('publication_date')->nullable();
            $table->timestamp('accessed_at')->nullable();
            $table->json('metadata')->nullable();
            $table->timestamps();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('sources');
    }
};
