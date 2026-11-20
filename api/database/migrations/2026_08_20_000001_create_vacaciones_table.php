<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

class CreateVacacionesTable extends Migration
{
    /**
     * Run the migrations.
     *
     * @return void
     */
    public function up()
    {
        Schema::create('vacaciones', function (Blueprint $table) {
            $table->id();
            $table->unsignedBigInteger('idEmpleado');
            $table->string('jefeInmediato')->nullable();
            $table->date('fechaInicio');
            $table->date('fechaFin');
            $table->integer('diasEfectivos');
            $table->integer('diasNaturales')->default(0);
            $table->string('diasDescanso')->default('Sabado,Domingo');
            $table->text('observaciones')->nullable();
            $table->string('estatus')->default('Autorizado');
            $table->boolean('activo')->default(1);
            $table->boolean('eliminado')->default(0);
            $table->timestamps();
        });
    }

    /**
     * Reverse the migrations.
     *
     * @return void
     */
    public function down()
    {
        Schema::dropIfExists('vacaciones');
    }
}
