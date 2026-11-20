<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

class CreatePlantillaSeccionesTable extends Migration
{
    /**
     * Run the migrations.
     *
     * @return void
     */
    public function up()
    {
        if (!Schema::hasTable('plantilla_secciones')) {
            Schema::create('plantilla_secciones', function (Blueprint $table) {
                $table->increments('id');
                $table->integer('idPlantilla');
                $table->integer('idSeccion');
                $table->string('area');
                $table->decimal('porcentajeArea', 5, 2)->default(50.00);
                $table->integer('totalPreguntas')->default(0);
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
        Schema::dropIfExists('plantilla_secciones');
    }
}
