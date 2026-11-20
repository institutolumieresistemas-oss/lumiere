<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;
use Illuminate\Support\Facades\DB;

class AddIndexesToCalificacionesTable extends Migration
{
    /**
     * Run the migrations.
     *
     * @return void
     */
    public function up()
    {
        if (Schema::hasTable('calificaciones')) {
            $indexes = DB::select("SHOW INDEX FROM calificaciones");
            $existing = [];
            foreach ($indexes as $idx) {
                $existing[$idx->Key_name] = true;
            }

            if (!isset($existing['idx_calificaciones_lookup'])) {
                DB::statement("ALTER TABLE calificaciones ADD INDEX idx_calificaciones_lookup (idFicha, idExamen, idSeccion)");
            }

            if (!isset($existing['idx_calificaciones_examen_ficha'])) {
                DB::statement("ALTER TABLE calificaciones ADD INDEX idx_calificaciones_examen_ficha (idExamen, idFicha)");
            }
        }
    }

    /**
     * Reverse the migrations.
     *
     * @return void
     */
    public function down()
    {
        if (Schema::hasTable('calificaciones')) {
            $indexes = DB::select("SHOW INDEX FROM calificaciones");
            $existing = [];
            foreach ($indexes as $idx) {
                $existing[$idx->Key_name] = true;
            }

            if (isset($existing['idx_calificaciones_lookup'])) {
                DB::statement("ALTER TABLE calificaciones DROP INDEX idx_calificaciones_lookup");
            }

            if (isset($existing['idx_calificaciones_examen_ficha'])) {
                DB::statement("ALTER TABLE calificaciones DROP INDEX idx_calificaciones_examen_ficha");
            }
        }
    }
}
