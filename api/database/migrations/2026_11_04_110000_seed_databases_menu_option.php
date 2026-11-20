<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

class SeedDatabasesMenuOption extends Migration
{
    /**
     * Run the migrations.
     *
     * @return void
     */
    public function up()
    {
        $modulo = \App\Modulo::where('nombre', 'like', '%Desarrollo%')->first();
        if (!$modulo) {
            $modulo = \App\Modulo::create([
                'nombre' => 'Desarrollo',
                'icono' => 'fas fa-code',
                'color' => 'bg-gradient-warning',
                'identificador' => 'desarrollo',
                'activo' => 1,
                'eliminado' => 0
            ]);
        }

        $opcion = \App\Opcione::where('ruta', '=', '/admin/databases')
            ->orWhere('ruta', '=', 'databases')
            ->first();

        if (!$opcion) {
            $opcion = \App\Opcione::create([
                'nombre' => 'Bases de Datos',
                'icono' => 'fas fa-database',
                'color' => 'bg-gradient-info',
                'ruta' => '/admin/databases',
                'idModulo' => $modulo->id,
                'activo' => 1,
                'eliminado' => 0
            ]);
        } else {
            $opcion->nombre = 'Bases de Datos';
            $opcion->icono = 'fas fa-database';
            $opcion->ruta = '/admin/databases';
            $opcion->idModulo = $modulo->id;
            $opcion->activo = 1;
            $opcion->eliminado = 0;
            $opcion->save();
        }

        // Asignar permisos copiando de otra opción de Desarrollo si existe
        $otraOpcion = \App\Opcione::where('idModulo', $modulo->id)->where('id', '!=', $opcion->id)->first();
        if ($otraOpcion) {
            $tipos = \App\Opcionespermiso::where('idOpcion', $otraOpcion->id)->pluck('idTipoUsuario');
            foreach ($tipos as $tipoId) {
                \App\Opcionespermiso::firstOrCreate([
                    'idOpcion' => $opcion->id,
                    'idTipoUsuario' => $tipoId
                ]);
                \App\Modulospermiso::firstOrCreate([
                    'idModulo' => $modulo->id,
                    'idTipoUsuario' => $tipoId
                ]);
            }
        }

        // Siempre otorgar acceso a administradores y directivos
        try {
            $adminTipos = \App\Tipousuario::where('id', 1)
                ->orWhere('nombre', 'like', '%administrador%')
                ->orWhere('nombre', 'like', '%directiv%')
                ->pluck('id');

            foreach ($adminTipos as $tipoId) {
                \App\Opcionespermiso::firstOrCreate([
                    'idOpcion' => $opcion->id,
                    'idTipoUsuario' => $tipoId
                ]);
                \App\Modulospermiso::firstOrCreate([
                    'idModulo' => $modulo->id,
                    'idTipoUsuario' => $tipoId
                ]);
            }
        } catch (\Throwable $e) {
            \App\Opcionespermiso::firstOrCreate([
                'idOpcion' => $opcion->id,
                'idTipoUsuario' => 1
            ]);
            \App\Modulospermiso::firstOrCreate([
                'idModulo' => $modulo->id,
                'idTipoUsuario' => 1
            ]);
        }
    }

    /**
     * Reverse the migrations.
     *
     * @return void
     */
    public function down()
    {
        $opcion = \App\Opcione::where('ruta', '=', '/admin/databases')
            ->orWhere('ruta', '=', 'databases')
            ->first();

        if ($opcion) {
            \App\Opcionespermiso::where('idOpcion', '=', $opcion->id)->delete();
            $opcion->delete();
        }
    }
}
