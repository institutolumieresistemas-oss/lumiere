<?php

namespace App\Http\Controllers;

use App\Vacacion;
use App\Empleado;
use App\Clases\Listas;
use Illuminate\Http\Request;
use Exception;

class VacacionesController extends Controller
{
    public function mostrar()
    {
        try {
            $datos['datos'] = Vacacion::join('empleados', 'vacaciones.idEmpleado', '=', 'empleados.id')
                ->leftJoin('puestos', 'empleados.idPuesto', '=', 'puestos.id')
                ->leftJoin('departamentos', 'empleados.idDepartamento', '=', 'departamentos.id')
                ->leftJoin('sucursales', 'empleados.idSucursal', '=', 'sucursales.id')
                ->select(
                    'vacaciones.*',
                    'empleados.nombre as empleado',
                    'empleados.fechaIngreso',
                    'puestos.nombre as puesto',
                    'departamentos.nombre as departamento',
                    'sucursales.nombre as sucursal'
                )
                ->where('vacaciones.eliminado', '=', 0)
                ->orderBy('vacaciones.id', 'desc')
                ->get();

            $datos['empleados'] = Empleado::select('id', 'nombre', 'fechaIngreso', 'idPuesto', 'idDepartamento', 'idSucursal')
                ->where('eliminado', 0)
                ->where('activo', 1)
                ->orderBy('nombre', 'asc')
                ->get();

            return response()->json($datos, 200);
        } catch (Exception $e) {
            return response()->json($e->getMessage(), 400);
        }
    }

    public function nuevo(Request $request)
    {
        try {
            $vacacion = Vacacion::create([
                'idEmpleado'    => $request->input('idEmpleado'),
                'jefeInmediato' => $request->input('jefeInmediato'),
                'fechaInicio'   => $request->input('fechaInicio'),
                'fechaFin'      => $request->input('fechaFin'),
                'diasEfectivos' => $request->input('diasEfectivos'),
                'diasNaturales' => $request->input('diasNaturales', 0),
                'diasDescanso'  => is_array($request->input('diasDescanso')) ? implode(',', $request->input('diasDescanso')) : $request->input('diasDescanso', 'Sabado,Domingo'),
                'observaciones' => $request->input('observaciones', ''),
                'estatus'       => $request->input('estatus', 'Autorizado'),
                'activo'        => 1,
                'eliminado'     => 0,
            ]);

            $registroCompleto = Vacacion::join('empleados', 'vacaciones.idEmpleado', '=', 'empleados.id')
                ->leftJoin('puestos', 'empleados.idPuesto', '=', 'puestos.id')
                ->leftJoin('departamentos', 'empleados.idDepartamento', '=', 'departamentos.id')
                ->leftJoin('sucursales', 'empleados.idSucursal', '=', 'sucursales.id')
                ->select(
                    'vacaciones.*',
                    'empleados.nombre as empleado',
                    'empleados.fechaIngreso',
                    'puestos.nombre as puesto',
                    'departamentos.nombre as departamento',
                    'sucursales.nombre as sucursal'
                )
                ->where('vacaciones.id', $vacacion->id)
                ->first();

            return response()->json($registroCompleto, 200);
        } catch (Exception $e) {
            return response()->json($e->getMessage(), 400);
        }
    }

    public function eliminar(Request $request)
    {
        try {
            $id = $request->input('id');
            $vacacion = Vacacion::find($id);
            if ($vacacion) {
                $vacacion->eliminado = 1;
                $vacacion->save();
            }
            return response()->json($vacacion, 200);
        } catch (Exception $e) {
            return response()->json($e->getMessage(), 400);
        }
    }
}
