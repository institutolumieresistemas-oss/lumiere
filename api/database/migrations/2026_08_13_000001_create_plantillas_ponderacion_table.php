<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

class CreatePlantillasPonderacionTable extends Migration
{
    /**
     * Run the migrations.
     *
     * @return void
     */
    public function up()
    {
        if (!Schema::hasTable('plantillas_ponderacion')) {
            Schema::create('plantillas_ponderacion', function (Blueprint $table) {
                $table->increments('id');
                $table->string('nombre');
                $table->string('descripcion')->nullable();
                $table->boolean('activo')->default(true);
                $table->boolean('eliminado')->default(false);
                $table->timestamps();
            });
        }
    }

    /**
     * Reverse the migrations.
     *
     * @return void
     */
    public function down()
    {
        Schema::dropIfExists('plantillas_ponderacion');
    }
}
