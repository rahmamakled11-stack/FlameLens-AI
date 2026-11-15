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
        Schema::create('publications', function (Blueprint $table) {
            $table->id();
            $table->foreignId('experiment_id')->constrained()->cascadeOnDelete();
            $table->string('title');
            $table->json('authors')->nullable();
            $table->string('publication_type')->nullable();
            $table->string('journal')->nullable();
            $table->string('doi')->nullable()->index();
            $table->text('publication_url')->nullable();
            $table->date('publication_date')->nullable();
            $table->longText('abstract')->nullable();
            $table->timestamps();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('publications');
    }
};
