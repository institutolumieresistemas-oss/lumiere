<?php

namespace App\Http\Controllers;

use App\Ficha;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Hash;
use Carbon\Carbon;
use Illuminate\Support\Facades\DB;

class CalificacionesController extends Controller
{
    function examenes(Request $request){
        try {
            $examenes = Ficha::find($request['id'])->examenes();
            return response()->json($examenes, 200);
        } catch (\Exception $e) {
            return response()->json('Error en el servidor', 400);
        }
    }

    public function recibirLumiereSocial(Request $request)
    {
        try {
            DB::beginTransaction();

            $idFicha = $request['idFicha'];
            $idExamen = $request['idExamen'];
            $secciones = $request['secciones'];

            if (!$idFicha || !$idExamen || !is_array($secciones)) {
                return response()->json("Datos de calificación incompletos", 400);
            }

            foreach ($secciones as $sec) {
                $calificacion = \App\Calificacione::where('idFicha', '=', $idFicha)
                                             ->where('idExamen', '=', $idExamen)
                                             ->where('idSeccion', '=', $sec['idSeccion'])
                                             ->first();

                if (!$calificacion) {
                    $calificacion = new \App\Calificacione();
                    $calificacion->idFicha = $idFicha;
                    $calificacion->idExamen = $idExamen;
                    $calificacion->idSeccion = $sec['idSeccion'];
                }

                $calificacion->aciertos = $sec['aciertos'] ?? 0;
                $calificacion->errores = $sec['errores'] ?? 0;
                $calificacion->ausentes = $sec['ausentes'] ?? 0;
                $calificacion->totalPreguntas = $sec['totalPreguntas'] ?? 0;
                $calificacion->tiempoSegundos = $sec['tiempoSegundos'] ?? 0;
                $calificacion->save();
            }

            DB::commit();

            return response()->json([
                'status' => 'success',
                'mensaje' => 'Calificaciones procesadas y guardadas correctamente en SIGA'
            ], 200);
        } catch (\Exception $e) {
            DB::rollBack();
            return response()->json("Error al procesar calificaciones: " . $e->getMessage(), 400);
        }
    }
}