<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

class AddBuzonFieldsToVacacionesTable extends Migration
{
    /**
     * Run the migrations.
     *
     * @return void
     */
    public function up()
    {
        Schema::table('vacaciones', function (Blueprint $table) {
            if (!Schema::hasColumn('vacaciones', 'idJefeInmediato')) {
                $table->unsignedBigInteger('idJefeInmediato')->nullable()->after('idEmpleado');
            }
            if (!Schema::hasColumn('vacaciones', 'motivoRechazo')) {
                $table->text('motivoRechazo')->nullable()->after('observaciones');
            }
            if (!Schema::hasColumn('vacaciones', 'leido_jefe')) {
                $table->boolean('leido_jefe')->default(0)->after('estatus');
            }
            if (!Schema::hasColumn('vacaciones', 'leido_empleado')) {
                $table->boolean('leido_empleado')->default(0)->after('leido_jefe');
            }
            if (!Schema::hasColumn('vacaciones', 'fechaRespuesta')) {
                $table->timestamp('fechaRespuesta')->nullable()->after('leido_empleado');
            }
        });
    }

    /**
     * Reverse the migrations.
     *
     * @return void
     */
    public function down()
    {
        Schema::table('vacaciones', function (Blueprint $table) {
            if (Schema::hasColumn('vacaciones', 'idJefeInmediato')) {
                $table->dropColumn('idJefeInmediato');
            }
            if (Schema::hasColumn('vacaciones', 'motivoRechazo')) {
                $table->dropColumn('motivoRechazo');
            }
            if (Schema::hasColumn('vacaciones', 'leido_jefe')) {
                $table->dropColumn('leido_jefe');
            }
            if (Schema::hasColumn('vacaciones', 'leido_empleado')) {
                $table->dropColumn('leido_empleado');
            }
            if (Schema::hasColumn('vacaciones', 'fechaRespuesta')) {
                $table->dropColumn('fechaRespuesta');
            }
        });
    }
}
