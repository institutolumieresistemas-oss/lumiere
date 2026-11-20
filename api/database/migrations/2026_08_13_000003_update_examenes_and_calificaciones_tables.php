<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

class UpdateExamenesAndCalificacionesTables extends Migration
{
    /**
     * Run the migrations.
     *
     * @return void
     */
    public function up()
    {
        if (Schema::hasTable('examenes')) {
            Schema::table('examenes', function (Blueprint $table) {
                if (!Schema::hasColumn('examenes', 'idPlantillaPonderacion')) {
                    $table->integer('idPlantillaPonderacion')->nullable()->after('forma');
                }
                if (!Schema::hasColumn('examenes', 'orden')) {
                    $table->integer('orden')->default(1)->after('idPlantillaPonderacion');
                }
            });
        }

        if (Schema::hasTable('calificaciones')) {
            Schema::table('calificaciones', function (Blueprint $table) {
                if (!Schema::hasColumn('calificaciones', 'totalPreguntas')) {
                    $table->integer('totalPreguntas')->default(0)->after('ausentes');
                }
                if (!Schema::hasColumn('calificaciones', 'tiempoSegundos')) {
                    $table->integer('tiempoSegundos')->default(0)->after('totalPreguntas');
                }
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
        if (Schema::hasTable('examenes')) {
            Schema::table('examenes', function (Blueprint $table) {
                if (Schema::hasColumn('examenes', 'idPlantillaPonderacion')) {
                    $table->dropColumn('idPlantillaPonderacion');
                }
                if (Schema::hasColumn('examenes', 'orden')) {
                    $table->dropColumn('orden');
                }
            });
        }

        if (Schema::hasTable('calificaciones')) {
            Schema::table('calificaciones', function (Blueprint $table) {
                if (Schema::hasColumn('calificaciones', 'totalPreguntas')) {
                    $table->dropColumn('totalPreguntas');
                }
                if (Schema::hasColumn('calificaciones', 'tiempoSegundos')) {
                    $table->dropColumn('tiempoSegundos');
                }
            });
        }
    }
}
