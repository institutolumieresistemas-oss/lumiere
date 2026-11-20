<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

class CreateReactivosAndReactivosSeccionesTables extends Migration
{
    /**
     * Run the migrations.
     *
     * @return void
     */
    public function up()
    {
        if (!Schema::hasTable('reactivos')) {
            Schema::create('reactivos', function (Blueprint $table) {
                $table->increments('id');
                $table->string('nombre');
                $table->decimal('porcentaje', 5, 2)->default(50.00);
                $table->boolean('activo')->default(true);
                $table->boolean('eliminado')->default(false);
                $table->timestamps();
            });
        }

        if (!Schema::hasTable('reactivo_secciones')) {
            Schema::create('reactivo_secciones', function (Blueprint $table) {
                $table->increments('id');
                $table->integer('idReactivo')->unsigned();
                $table->integer('idSeccion')->unsigned();
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
        Schema::dropIfExists('reactivo_secciones');
        Schema::dropIfExists('reactivos');
    }
}
