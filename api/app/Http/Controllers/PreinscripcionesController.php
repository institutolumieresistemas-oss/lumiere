<?php

namespace App\Http\Controllers;

use App\Preinscripcione;
use Laravel\Lumen\Routing\Controller as BaseController;
use Illuminate\Http\Request;

class PreinscripcionesController extends BaseController
{
    public function catalogos() {
        try {
            $sucursales = \App\Sucursale::where('activo', '=', 1)
                ->where('eliminado', '=', 0)
                ->whereNotNull('imagen')
                ->where('imagen', '!=', '')
                ->get();

            $estados = \App\Estado::where('activo', '=', 1)->where('eliminado', '=', 0)->get();
            $municipios = \App\Municipio::where('activo', '=', 1)->where('eliminado', '=', 0)->get();
            $escuelas = \App\Escuela::where('activo', '=', 1)->where('eliminado', '=', 0)->get();
            $centros = \App\Centrosuniversitario::where('activo', '=', 1)->where('eliminado', '=', 0)->get();
            $calendarioActual = \App\Calendario::where('activo', '=', 1)->where('eliminado', '=', 0)->orderBy('id', 'DESC')->first();

            $carreras = \App\Carrera::where('eliminado', '=', 0)->get();

            $uniIds = $centros->pluck('idUniversidad')->unique();
            $universidades = \App\Universidade::where('activo', '=', 1)
                ->where('eliminado', '=', 0)
                ->whereIn('id', $uniIds)
                ->orderByRaw("CASE WHEN id = 7 THEN 0 ELSE 1 END, nombre ASC")
                ->get();

            $calIds = $carreras->pluck('idCalendario')->unique();
            $calendarios = \App\Calendario::where('activo', '=', 1)
                ->where('eliminado', '=', 0)
                ->whereIn('id', $calIds)
                ->orderBy('id', 'DESC')
                ->get();

            $empresas = \App\Empresascurso::where('activo', '=', 1)->where('eliminado', '=', 0)->get();
            $mediosPublicitarios = \App\Mediospublicitario::where('activo', '=', 1)->where('eliminado', '=', 0)->get();

            return response()->json([
                'sucursales' => $sucursales,
                'estados' => $estados,
                'municipios' => $municipios,
                'escuelas' => $escuelas,
                'universidades' => $universidades,
                'centros' => $centros,
                'calendarios' => $calendarios,
                'carreras' => $carreras,
                'calendarioActual' => $calendarioActual,
                'empresas' => $empresas,
                'mediosPublicitarios' => $mediosPublicitarios
            ], 200);
        } catch (\Exception $e) {
            return response()->json('Error al cargar catálogos: ' . $e->getMessage(), 400);
        }
    }

    public function mostrar() {
        try {
            $preinscripciones = Preinscripcione::where('eliminado', '=', 0)
                ->orderBy('created_at', 'DESC')
                ->get();
            return response()->json($preinscripciones, 200);
        } catch (\Exception $e) {
            return response()->json('Error al traer preinscripciones: ' . $e->getMessage(), 400);
        }
    }

    public function eliminar(Request $request) {
        try {
            $preinscripcion = Preinscripcione::find($request['id']);
            if ($preinscripcion) {
                $preinscripcion->eliminado = 1;
                $preinscripcion->save();
            }
            return response()->json($preinscripcion, 200);
        } catch (\Exception $e) {
            return response()->json('Error al eliminar preinscripción: ' . $e->getMessage(), 400);
        }
    }

    public function guardar(Request $request) {
        try {
            $datos = $request->all();
            if (empty($datos['fechaNacimiento'] ?? null) || trim($datos['fechaNacimiento']) === '') {
                return response()->json('La fecha de nacimiento es obligatoria', 400);
            }
            if (empty($datos['padreTutor'] ?? null) || trim($datos['padreTutor']) === '') {
                return response()->json('El nombre del padre o tutor es obligatorio', 400);
            }
            if (empty($datos['celularPadreTutor'] ?? null) || trim($datos['celularPadreTutor']) === '') {
                return response()->json('El celular del padre o tutor es obligatorio', 400);
            }

            if (!empty($datos['promedio'])) {
                $promStr = str_replace(',', '.', trim($datos['promedio']));
                $prom = floatval($promStr);
                if ($prom > 0 && $prom <= 10) {
                    $prom = $prom * 10;
                }
                if ($prom > 100) {
                    $prom = 100;
                }
                $datos['promedio'] = number_format($prom, 2, '.', '');
            }

            $preinscripcion = Preinscripcione::create([
                'datos' => $datos,
                'activo' => 1,
                'eliminado' => 0
            ]);

            return response()->json([
                'status' => 'success',
                'mensaje' => 'Preinscripción registrada correctamente',
                'data' => $preinscripcion
            ], 200);
        } catch (\Exception $e) {
            return response()->json('Error al procesar la preinscripción: ' . $e->getMessage(), 400);
        }
    }
}
