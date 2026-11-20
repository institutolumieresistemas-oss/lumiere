<?php

namespace App\Http\Controllers;

use App\Reactivo;
use App\Reactivoseccione;
use Laravel\Lumen\Routing\Controller as BaseController;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;

class ReactivosController extends BaseController
{
    function catalogo() {
        try {
            $reactivos = Reactivo::where('eliminado', '=', 0)->get();
            foreach ($reactivos as $reactivo) {
                $reactivo->secciones = DB::table('reactivo_secciones')
                    ->join('secciones', 'reactivo_secciones.idSeccion', '=', 'secciones.id')
                    ->where('reactivo_secciones.idReactivo', '=', $reactivo->id)
                    ->where('secciones.eliminado', '=', 0)
                    ->select('secciones.id', 'secciones.nombre')
                    ->get();
            }
            return response()->json($reactivos, 200);
        } catch (\Exception $e) {
            return response()->json('Error en el servidor', 400);
        }
    }

    function nuevo(Request $request) {
        try {
            $reactivo = Reactivo::create([
                'nombre' => $request['nombre'],
                'porcentaje' => $request['porcentaje'] ?? 50.00,
                'activo' => 1,
                'eliminado' => 0
            ]);
            return response()->json($reactivo, 200);
        } catch (\Exception $e) {
            return response()->json('Error en el servidor', 400);
        }
    }

    function modificar(Request $request) {
        try {
            $reactivo = Reactivo::find($request['id']);
            if (!$reactivo) {
                return response()->json('Reactivo no encontrado', 404);
            }
            $reactivo->nombre = $request['nombre'];
            $reactivo->porcentaje = $request['porcentaje'];
            $reactivo->save();
            return response()->json($reactivo, 200);
        } catch (\Exception $e) {
            return response()->json('Error en el servidor', 400);
        }
    }

    function eliminar(Request $request) {
        try {
            $reactivo = Reactivo::find($request['id']);
            if (!$reactivo) {
                return response()->json('Reactivo no encontrado', 404);
            }
            $reactivo->eliminado = 1;
            $reactivo->save();
            return response()->json('Eliminado correctamente', 200);
        } catch (\Exception $e) {
            return response()->json('Error en el servidor', 400);
        }
    }

    function asociarSecciones(Request $request) {
        try {
            DB::beginTransaction();
            $idReactivo = $request['idReactivo'];
            $secciones = $request['secciones']; // Array of section IDs

            if (!is_array($secciones)) {
                return response()->json('Formato de secciones inválido', 400);
            }

            // Remove existing relationships for this Reactivo
            Reactivoseccione::where('idReactivo', '=', $idReactivo)->delete();

            foreach ($secciones as $idSeccion) {
                // Remove this section from any other Reactivo first to keep it 1-to-1 or 1-to-many
                Reactivoseccione::where('idSeccion', '=', $idSeccion)->delete();

                Reactivoseccione::create([
                    'idReactivo' => $idReactivo,
                    'idSeccion' => $idSeccion
                ]);
            }

            DB::commit();
            return response()->json('Secciones asociadas correctamente', 200);
        } catch (\Exception $e) {
            DB::rollBack();
            return response()->json('Error al asociar secciones', 400);
        }
    }
}
