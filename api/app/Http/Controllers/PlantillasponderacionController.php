<?php

namespace App\Http\Controllers;

use App\Plantillaponderacion;
use App\Plantillaseccion;
use App\Seccione;
use Laravel\Lumen\Routing\Controller as BaseController;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;

class PlantillasponderacionController extends BaseController
{
    public function nuevo(Request $request)
    {
        try {
            DB::beginTransaction();

            $plantilla = Plantillaponderacion::create([
                'nombre' => $request['nombre'],
                'descripcion' => $request['descripcion'] ?? '',
                'activo' => 1,
                'eliminado' => 0
            ]);

            if (isset($request['secciones']) && is_array($request['secciones'])) {
                foreach ($request['secciones'] as $sec) {
                    Plantillaseccion::create([
                        'idPlantilla' => $plantilla->id,
                        'idSeccion' => $sec['idSeccion'],
                        'area' => $sec['area'] ?? 'Verbal',
                        'porcentajeArea' => $sec['porcentajeArea'] ?? 50.00,
                        'totalPreguntas' => $sec['totalPreguntas'] ?? 0,
                        'activo' => 1,
                        'eliminado' => 0
                    ]);
                }
            }

            DB::commit();
            $plantilla->secciones = Plantillaseccion::where('idPlantilla', '=', $plantilla->id)->where('eliminado', '=', 0)->get();

            return response()->json($plantilla, 200);
        } catch (\Exception $e) {
            DB::rollBack();
            return response()->json("Error al crear plantilla: " . $e->getMessage(), 400);
        }
    }

    public function mostrar()
    {
        try {
            $plantillas = Plantillaponderacion::where('eliminado', '=', 0)->get();
            foreach ($plantillas as $p) {
                $p->secciones = Plantillaseccion::join('secciones', 'plantilla_secciones.idSeccion', '=', 'secciones.id')->
                                                select('plantilla_secciones.*', 'secciones.nombre as seccionNombre')->
                                                where('plantilla_secciones.idPlantilla', '=', $p->id)->
                                                where('plantilla_secciones.eliminado', '=', 0)->get();
            }

            return response()->json($plantillas, 200);
        } catch (\Exception $e) {
            return response()->json("Error al obtener plantillas", 400);
        }
    }

    public function modificar(Request $request)
    {
        try {
            DB::beginTransaction();

            $plantilla = Plantillaponderacion::find($request['id']);
            if (!$plantilla) {
                return response()->json("Plantilla no encontrada", 404);
            }

            $plantilla->nombre = $request['nombre'];
            $plantilla->descripcion = $request['descripcion'] ?? '';
            $plantilla->save();

            // Re-asignar secciones
            if (isset($request['secciones']) && is_array($request['secciones'])) {
                // Marcar anteriores como eliminadas
                Plantillaseccion::where('idPlantilla', '=', $plantilla->id)->update(['eliminado' => 1]);

                foreach ($request['secciones'] as $sec) {
                    Plantillaseccion::create([
                        'idPlantilla' => $plantilla->id,
                        'idSeccion' => $sec['idSeccion'],
                        'area' => $sec['area'] ?? 'Verbal',
                        'porcentajeArea' => $sec['porcentajeArea'] ?? 50.00,
                        'totalPreguntas' => $sec['totalPreguntas'] ?? 0,
                        'activo' => 1,
                        'eliminado' => 0
                    ]);
                }
            }

            DB::commit();
            $plantilla->secciones = Plantillaseccion::where('idPlantilla', '=', $plantilla->id)->where('eliminado', '=', 0)->get();

            return response()->json($plantilla, 200);
        } catch (\Exception $e) {
            DB::rollBack();
            return response()->json("Error al modificar plantilla", 400);
        }
    }

    public function eliminar(Request $request)
    {
        try {
            $plantilla = Plantillaponderacion::find($request['id']);
            if ($plantilla) {
                $plantilla->eliminado = 1;
                $plantilla->save();
            }

            return response()->json($plantilla, 200);
        } catch (\Exception $e) {
            return response()->json("Error al eliminar plantilla", 400);
        }
    }
}
