<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;
use Illuminate\Support\Facades\DB;

class AddIndexesToFichasTable extends Migration
{
    /**
     * Run the migrations.
     *
     * @return void
     */
    public function up()
    {
        if (Schema::hasTable('fichas')) {
            $indexes = DB::select("SHOW INDEX FROM fichas");
            $existing = [];
            foreach ($indexes as $idx) {
                $existing[$idx->Key_name] = true;
            }

            if (!isset($existing['idx_fichas_grupo_estatus'])) {
                DB::statement("ALTER TABLE fichas ADD INDEX idx_fichas_grupo_estatus (idGrupo, eliminado, estatus)");
            }

            if (!isset($existing['idx_fichas_alumno'])) {
                DB::statement("ALTER TABLE fichas ADD INDEX idx_fichas_alumno (idAlumno)");
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
        if (Schema::hasTable('fichas')) {
            $indexes = DB::select("SHOW INDEX FROM fichas");
            $existing = [];
            foreach ($indexes as $idx) {
                $existing[$idx->Key_name] = true;
            }

            if (isset($existing['idx_fichas_grupo_estatus'])) {
                DB::statement("ALTER TABLE fichas DROP INDEX idx_fichas_grupo_estatus");
            }

            if (isset($existing['idx_fichas_alumno'])) {
                DB::statement("ALTER TABLE fichas DROP INDEX idx_fichas_alumno");
            }
        }
    }
}
