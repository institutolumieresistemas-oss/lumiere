<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

class GrantAllRolesPreinscripcionesPermission extends Migration
{
    /**
     * Run the migrations.
     *
     * @return void
     */
    public function up()
    {
        $opcion = \App\Opcione::where('ruta', 'like', '%preinscripciones%')
            ->orWhere('nombre', 'like', '%Preinscripcione%')
            ->first();

        if ($opcion) {
            // Asegurarse de que esté activa y no eliminada
            $opcion->activo = 1;
            $opcion->eliminado = 0;
            $opcion->save();

            // Otorgar permiso a todos los tipos de usuario activos
            $tiposUsuarios = \App\Tipousuario::where('eliminado', '=', 0)->get();
            foreach ($tiposUsuarios as $tipo) {
                \App\Opcionespermiso::firstOrCreate([
                    'idOpcion' => $opcion->id,
                    'idTipoUsuario' => $tipo->id
                ]);

                // Asegurarse de que también tenga permiso en el módulo padre
                if ($opcion->idModulo) {
                    \App\Modulospermiso::firstOrCreate([
                        'idModulo' => $opcion->idModulo,
                        'idTipoUsuario' => $tipo->id
                    ]);
                }
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
    }
}
