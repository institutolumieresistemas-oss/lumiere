<?php

namespace App\Http\Controllers;

use App\Usuario;
use App\Empleado;
use App\Calendario;
use App\Usuariosucursale;
use App\Sucursale;
use App\Ficha;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\DB;

class DesarrolloController extends Controller
{
    function verPassword(Request $request){
        try{
            $codificacion = Hash::make($request['password']);
            $respuesta['codificacion'] = $codificacion;
            return response()->json($respuesta, 200);
        }catch(Exception $e){
            return response()->json("Error en el servidor", 400);
        }
    }

    function testing(Request $request){
        try {
            $idFicha = $request['idFicha'];
            $idExamen = $request['idExamen'];

            $aciertosPorPorcentaje = DB::table('examenporcentajes as ep')
            ->join('seccionesporcentajes as sp', 'sp.idPorcentaje', '=', 'ep.id')
            ->join('secciones as s', function ($join) {
                $join->on('s.id', '=', 'sp.idSeccion')
                     ->on('s.idExamen', '=', 'ep.idExamen');
            })
            ->join('calificaciones as c', function ($join) {
                $join->on('c.idSeccion', '=', 's.id')
                     ->on('c.idExamen', '=', 's.idExamen');
            })
            ->select(
                'ep.idExamen',
                'ep.id as idPorcentaje',
                'ep.nombre as porcentaje',
                DB::raw('SUM(c.aciertos) as total_aciertos')
            )
            ->where('c.idFicha', $idFicha)     // 🔸 Filtro por ficha
            ->where('ep.idExamen', $idExamen)  // 🔸 Filtro por examen
            ->groupBy('ep.idExamen', 'ep.id', 'ep.nombre')
            ->get();

            return response()->json($aciertosPorPorcentaje, 200);
        } catch (Exception $e) {
            return response()->json('Error en el servidor', 400);
        }
    }

    public function tablas(Request $request)
    {
        try {
            $tablas = DB::select("SELECT table_name as nombre, table_rows as filas 
                                  FROM information_schema.tables 
                                  WHERE table_schema = DATABASE() 
                                  ORDER BY table_name ASC");

            $resultado = array_map(function ($t) {
                return [
                    'nombre' => $t->nombre,
                    'filas' => (int) ($t->filas ?? 0)
                ];
            }, $tablas);

            return response()->json($resultado, 200);
        } catch (\Exception $e) {
            return response()->json('Error al obtener tablas: ' . $e->getMessage(), 400);
        }
    }

    private function validarTabla($tabla)
    {
        if (empty($tabla) || !is_string($tabla)) {
            return false;
        }
        $valida = DB::select("SELECT table_name FROM information_schema.tables WHERE table_schema = DATABASE() AND table_name = ?", [$tabla]);
        return !empty($valida);
    }

    private function obtenerColumnasTabla($tabla)
    {
        return DB::select("SHOW COLUMNS FROM `{$tabla}`");
    }

    private function detectarPrimaryKey($columnas)
    {
        foreach ($columnas as $col) {
            if ($col->Key === 'PRI') {
                return $col->Field;
            }
        }
        foreach ($columnas as $col) {
            if (strtolower($col->Field) === 'id') {
                return $col->Field;
            }
        }
        return !empty($columnas) ? $columnas[0]->Field : 'id';
    }

    public function buscarRegistro(Request $request)
    {
        try {
            $tabla = $request->input('tabla');
            $id = $request->input('id');

            if (empty($tabla)) {
                return response()->json('Debe seleccionar una tabla.', 400);
            }
            if ($id === null || $id === '') {
                return response()->json('Debe ingresar un ID a buscar.', 400);
            }
            if (!$this->validarTabla($tabla)) {
                return response()->json('Tabla no válida o no encontrada.', 400);
            }

            $columnas = $this->obtenerColumnasTabla($tabla);
            $pk = $this->detectarPrimaryKey($columnas);

            $registro = DB::table($tabla)->where($pk, $id)->first();

            if (!$registro) {
                return response()->json("No se encontró ningún registro con {$pk} = '{$id}' en la tabla '{$tabla}'.", 404);
            }

            $tieneEliminado = false;
            foreach ($columnas as $col) {
                if (strtolower($col->Field) === 'eliminado') {
                    $tieneEliminado = true;
                    break;
                }
            }

            return response()->json([
                'tabla' => $tabla,
                'primaryKey' => $pk,
                'columnas' => $columnas,
                'registro' => (array) $registro,
                'tieneEliminado' => $tieneEliminado
            ], 200);
        } catch (\Exception $e) {
            return response()->json('Error al buscar registro: ' . $e->getMessage(), 400);
        }
    }

    public function registrosRecientes(Request $request)
    {
        try {
            $tabla = $request->input('tabla');
            if (empty($tabla) || !$this->validarTabla($tabla)) {
                return response()->json('Tabla no válida.', 400);
            }

            $columnas = $this->obtenerColumnasTabla($tabla);
            $pk = $this->detectarPrimaryKey($columnas);

            $registros = DB::table($tabla)->orderBy($pk, 'desc')->limit(8)->get();

            return response()->json([
                'primaryKey' => $pk,
                'registros' => $registros
            ], 200);
        } catch (\Exception $e) {
            return response()->json('Error al obtener registros recientes: ' . $e->getMessage(), 400);
        }
    }

    public function modificarRegistro(Request $request)
    {
        try {
            $tabla = $request->input('tabla');
            $id = $request->input('id');
            $datos = $request->input('datos');

            if (empty($tabla) || !$this->validarTabla($tabla)) {
                return response()->json('Tabla no válida.', 400);
            }
            if ($id === null || $id === '') {
                return response()->json('ID no especificado.', 400);
            }
            if (!is_array($datos)) {
                return response()->json('Datos no válidos.', 400);
            }

            $columnas = $this->obtenerColumnasTabla($tabla);
            $pk = $this->detectarPrimaryKey($columnas);

            $existente = DB::table($tabla)->where($pk, $id)->first();
            if (!$existente) {
                return response()->json('El registro que intenta modificar no existe.', 404);
            }

            $colsMap = [];
            foreach ($columnas as $col) {
                $colsMap[$col->Field] = $col;
            }

            $datosActualizar = [];
            foreach ($datos as $campo => $valor) {
                if (!isset($colsMap[$campo])) {
                    continue;
                }
                // Si es primary key y auto_increment, no modificarlo
                if ($campo === $pk && str_contains(strtolower($colsMap[$campo]->Extra ?? ''), 'auto_increment')) {
                    continue;
                }

                // Si es string vacío y el campo admite NULL, guardarlo como NULL
                if ($valor === '' && ($colsMap[$campo]->Null ?? '') === 'YES') {
                    $valor = null;
                }

                $datosActualizar[$campo] = $valor;
            }

            if (isset($colsMap['updated_at']) && !array_key_exists('updated_at', $datos)) {
                $datosActualizar['updated_at'] = date('Y-m-d H:i:s');
            }

            if (!empty($datosActualizar)) {
                DB::table($tabla)->where($pk, $id)->update($datosActualizar);
            }

            $actualizado = DB::table($tabla)->where($pk, $id)->first();

            return response()->json([
                'mensaje' => 'Registro modificado exitosamente.',
                'registro' => (array) $actualizado
            ], 200);
        } catch (\Exception $e) {
            return response()->json('Error al modificar registro: ' . $e->getMessage(), 400);
        }
    }

    public function eliminarRegistro(Request $request)
    {
        try {
            $tabla = $request->input('tabla');
            $id = $request->input('id');
            $tipo = $request->input('tipo', 'permanente'); // 'logica' o 'permanente'

            if (empty($tabla) || !$this->validarTabla($tabla)) {
                return response()->json('Tabla no válida.', 400);
            }
            if ($id === null || $id === '') {
                return response()->json('ID no especificado.', 400);
            }

            $columnas = $this->obtenerColumnasTabla($tabla);
            $pk = $this->detectarPrimaryKey($columnas);

            $existente = DB::table($tabla)->where($pk, $id)->first();
            if (!$existente) {
                return response()->json('El registro que intenta eliminar no existe.', 404);
            }

            $tieneEliminado = false;
            foreach ($columnas as $col) {
                if (strtolower($col->Field) === 'eliminado') {
                    $tieneEliminado = true;
                    break;
                }
            }

            if ($tipo === 'logica' && $tieneEliminado) {
                $update = ['eliminado' => 1];
                foreach ($columnas as $col) {
                    if (strtolower($col->Field) === 'updated_at') {
                        $update['updated_at'] = date('Y-m-d H:i:s');
                        break;
                    }
                }
                DB::table($tabla)->where($pk, $id)->update($update);
                return response()->json(['mensaje' => 'Registro marcado como eliminado (soft delete).'], 200);
            } else {
                DB::table($tabla)->where($pk, $id)->delete();
                return response()->json(['mensaje' => 'Registro eliminado permanentemente.'], 200);
            }
        } catch (\Exception $e) {
            return response()->json('Error al eliminar registro: ' . $e->getMessage(), 400);
        }
    }
}