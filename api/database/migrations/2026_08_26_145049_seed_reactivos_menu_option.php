<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

class SeedReactivosMenuOption extends Migration
{
    /**
     * Run the migrations.
     *
     * @return void
     */
    public function up()
    {
        $modulo = \App\Modulo::where('nombre', 'like', '%Catálogos%')
            ->orWhere('nombre', 'like', '%Catalogos%')
            ->first();

        if ($modulo) {
            $opcion = \App\Opcione::where('ruta', '=', '/admin/reactivos')->first();
            if (!$opcion) {
                $opcion = \App\Opcione::create([
                    'nombre' => 'Reactivos',
                    'icono' => 'fas fa-tasks',
                    'color' => 'bg-gradient-primary',
                    'ruta' => '/admin/reactivos',
                    'idModulo' => $modulo->id,
                    'activo' => 1,
                    'eliminado' => 0
                ]);
            }

            // Copy permissions from another catalog option, e.g. /admin/bancos
            $bancosOpcion = \App\Opcione::where('ruta', '=', 'bancos')
                ->orWhere('ruta', '=', '/admin/bancos')
                ->orWhere('nombre', 'like', '%Bancos%')
                ->first();

            if ($bancosOpcion) {
                $tiposConAcceso = \App\Opcionespermiso::where('idOpcion', '=', $bancosOpcion->id)->pluck('idTipoUsuario');
                foreach ($tiposConAcceso as $tipoId) {
                    \App\Opcionespermiso::firstOrCreate([
                        'idOpcion' => $opcion->id,
                        'idTipoUsuario' => $tipoId
                    ]);
                }
            } else {
                // Fallback: grant to idTipoUsuario = 1 (usually Admin)
                \App\Opcionespermiso::firstOrCreate([
                    'idOpcion' => $opcion->id,
                    'idTipoUsuario' => 1
                ]);
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
        $opcion = \App\Opcione::where('ruta', '=', '/admin/reactivos')->first();
        if ($opcion) {
            \App\Opcionespermiso::where('idOpcion', '=', $opcion->id)->delete();
            $opcion->delete();
        }
    }
}
