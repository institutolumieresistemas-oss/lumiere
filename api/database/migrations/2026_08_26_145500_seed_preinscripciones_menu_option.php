<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

class SeedPreinscripcionesMenuOption extends Migration
{
    /**
     * Run the migrations.
     *
     * @return void
     */
    public function up()
    {
        // 1. Encontrar el módulo de Administrativo / Administrador / Inscripciones
        $modulo = \App\Modulo::where('nombre', 'like', '%Administrativo%')
            ->orWhere('nombre', 'like', '%Administrador%')
            ->first();

        $inscripcionesOpcion = \App\Opcione::where('ruta', 'like', '%inscripciones%')
            ->orWhere('nombre', 'like', '%Inscripcione%')
            ->first();

        $idModulo = null;
        if ($modulo) {
            $idModulo = $modulo->id;
        } elseif ($inscripcionesOpcion) {
            $idModulo = $inscripcionesOpcion->idModulo;
        }

        // Determinar formato de ruta acorde a las existentes
        $rutaPreinscripciones = 'preinscripciones';
        if ($inscripcionesOpcion) {
            if (strpos($inscripcionesOpcion->ruta, '/admin/') !== false) {
                $rutaPreinscripciones = '/admin/preinscripciones';
            } elseif (substr($inscripcionesOpcion->ruta, 0, 1) === '/') {
                $rutaPreinscripciones = '/preinscripciones';
            }
        }

        if ($idModulo) {
            $opcion = \App\Opcione::where('ruta', 'like', '%preinscripciones%')->first();
            if (!$opcion) {
                $opcion = \App\Opcione::create([
                    'nombre' => 'Preinscripciones',
                    'icono' => 'fas fa-user-graduate',
                    'color' => 'bg-gradient-warning',
                    'ruta' => $rutaPreinscripciones,
                    'idModulo' => $idModulo,
                    'activo' => 1,
                    'eliminado' => 0
                ]);
            } else {
                $opcion->activo = 1;
                $opcion->eliminado = 0;
                $opcion->idModulo = $idModulo;
                $opcion->save();
            }

            // Copiar permisos de Inscripciones si existe
            if ($inscripcionesOpcion) {
                $tiposConAcceso = \App\Opcionespermiso::where('idOpcion', '=', $inscripcionesOpcion->id)->pluck('idTipoUsuario');
                foreach ($tiposConAcceso as $tipoId) {
                    \App\Opcionespermiso::firstOrCreate([
                        'idOpcion' => $opcion->id,
                        'idTipoUsuario' => $tipoId
                    ]);
                }
            } else {
                // Fallback a rol 1 (Administrador)
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
        $opcion = \App\Opcione::where('ruta', 'like', '%preinscripciones%')->first();
        if ($opcion) {
            \App\Opcionespermiso::where('idOpcion', '=', $opcion->id)->delete();
            $opcion->delete();
        }
    }
}
