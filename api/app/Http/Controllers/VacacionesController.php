<?php

namespace App\Http\Controllers;

use App\Vacacion;
use App\Empleado;
use App\Clases\Listas;
use Illuminate\Http\Request;
use Illuminate\Support\Carbon;
use Illuminate\Support\Facades\Schema;
use Illuminate\Database\Schema\Blueprint;
use Exception;

class VacacionesController extends Controller
{
    /**
     * Asegura de manera defensiva que las columnas necesarias existan en la tabla vacaciones.
     */
    private function asegurarColumnas()
    {
        try {
            if (!Schema::hasColumn('vacaciones', 'idJefeInmediato')) {
                Schema::table('vacaciones', function (Blueprint $table) {
                    $table->unsignedBigInteger('idJefeInmediato')->nullable()->after('idEmpleado');
                    $table->text('motivoRechazo')->nullable()->after('observaciones');
                    $table->boolean('leido_jefe')->default(0)->after('estatus');
                    $table->boolean('leido_empleado')->default(0)->after('leido_jefe');
                    $table->timestamp('fechaRespuesta')->nullable()->after('leido_empleado');
                });
            }
        } catch (\Throwable $e) {
            // Ignorar si ya existen o no hay permisos ddl
        }
    }

    public function mostrar()
    {
        try {
            $this->asegurarColumnas();

            $datos['datos'] = Vacacion::join('empleados', 'vacaciones.idEmpleado', '=', 'empleados.id')
                ->leftJoin('puestos', 'empleados.idPuesto', '=', 'puestos.id')
                ->leftJoin('departamentos', 'empleados.idDepartamento', '=', 'departamentos.id')
                ->leftJoin('sucursales', 'empleados.idSucursal', '=', 'sucursales.id')
                ->leftJoin('empleados as jefe', 'vacaciones.idJefeInmediato', '=', 'jefe.id')
                ->select(
                    'vacaciones.*',
                    'empleados.nombre as empleado',
                    'empleados.fechaIngreso',
                    'puestos.nombre as puesto',
                    'departamentos.nombre as departamento',
                    'sucursales.nombre as sucursal',
                    'jefe.nombre as nombreJefeDirecto'
                )
                ->where('vacaciones.eliminado', '=', 0)
                ->orderBy('vacaciones.id', 'desc')
                ->get();

            $datos['empleados'] = Empleado::leftJoin('puestos', 'empleados.idPuesto', '=', 'puestos.id')
                ->leftJoin('departamentos', 'empleados.idDepartamento', '=', 'departamentos.id')
                ->leftJoin('sucursales', 'empleados.idSucursal', '=', 'sucursales.id')
                ->select(
                    'empleados.id',
                    'empleados.nombre',
                    'empleados.fechaIngreso',
                    'empleados.idPuesto',
                    'empleados.idDepartamento',
                    'empleados.idSucursal',
                    'puestos.nombre as puesto',
                    'departamentos.nombre as departamento',
                    'sucursales.nombre as sucursal'
                )
                ->where('empleados.eliminado', 0)
                ->where('empleados.activo', 1)
                ->orderBy('empleados.nombre', 'asc')
                ->get();

            return response()->json($datos, 200);
        } catch (Exception $e) {
            return response()->json($e->getMessage(), 400);
        }
    }

    public function nuevo(Request $request)
    {
        try {
            $this->asegurarColumnas();

            $idEmpleado = $request->input('idEmpleado');
            $fechaInicio = $request->input('fechaInicio');
            $fechaFin = $request->input('fechaFin');

            if (empty($idEmpleado) || empty($fechaInicio) || empty($fechaFin)) {
                return response()->json('Debe proporcionar el empleado, fecha de inicio y fecha de fin.', 400);
            }

            // Validar traslape de fechas con otra solicitud existente activa del mismo empleado
            // "a menos que la otra solicitud este eliminada o rechazada"
            $traslape = Vacacion::where('idEmpleado', $idEmpleado)
                ->where('eliminado', 0)
                ->where('estatus', '!=', 'Rechazado')
                ->where(function ($q) use ($fechaInicio, $fechaFin) {
                    $q->where('fechaInicio', '<=', $fechaFin)
                      ->where('fechaFin', '>=', $fechaInicio);
                })
                ->first();

            if ($traslape) {
                return response()->json(
                    "No se puede registrar la solicitud: El rango de fechas seleccionado ({$fechaInicio} al {$fechaFin}) se traslapa con otra solicitud ya registrada del {$traslape->fechaInicio} al {$traslape->fechaFin} con estatus '{$traslape->estatus}'. Para utilizar estas fechas, la solicitud previa debe ser eliminada o rechazada.",
                    400
                );
            }

            $idJefe = $request->input('idJefeInmediato');
            $nombreJefe = $request->input('jefeInmediato', '');

            if (!empty($idJefe) && empty($nombreJefe)) {
                $jefe = Empleado::find($idJefe);
                if ($jefe) {
                    $nombreJefe = $jefe->nombre;
                }
            }

            $vacacion = Vacacion::create([
                'idEmpleado'      => $request->input('idEmpleado'),
                'idJefeInmediato' => $idJefe ? intval($idJefe) : null,
                'jefeInmediato'   => $nombreJefe,
                'fechaInicio'     => $request->input('fechaInicio'),
                'fechaFin'        => $request->input('fechaFin'),
                'diasEfectivos'   => $request->input('diasEfectivos'),
                'diasNaturales'   => $request->input('diasNaturales', 0),
                'diasDescanso'    => is_array($request->input('diasDescanso')) ? implode(',', $request->input('diasDescanso')) : $request->input('diasDescanso', 'Sabado,Domingo'),
                'observaciones'   => $request->input('observaciones', ''),
                'estatus'         => $request->input('estatus', 'Pendiente'), // Solicitud por defecto Pendiente
                'leido_jefe'      => 0, // Nueva notificación para el jefe
                'leido_empleado'  => 1,
                'activo'          => 1,
                'eliminado'       => 0,
            ]);

            $registroCompleto = Vacacion::join('empleados', 'vacaciones.idEmpleado', '=', 'empleados.id')
                ->leftJoin('puestos', 'empleados.idPuesto', '=', 'puestos.id')
                ->leftJoin('departamentos', 'empleados.idDepartamento', '=', 'departamentos.id')
                ->leftJoin('sucursales', 'empleados.idSucursal', '=', 'sucursales.id')
                ->leftJoin('empleados as jefe', 'vacaciones.idJefeInmediato', '=', 'jefe.id')
                ->select(
                    'vacaciones.*',
                    'empleados.nombre as empleado',
                    'empleados.fechaIngreso',
                    'puestos.nombre as puesto',
                    'departamentos.nombre as departamento',
                    'sucursales.nombre as sucursal',
                    'jefe.nombre as nombreJefeDirecto'
                )
                ->where('vacaciones.id', $vacacion->id)
                ->first();

            return response()->json($registroCompleto, 200);
        } catch (Exception $e) {
            return response()->json($e->getMessage(), 400);
        }
    }

    /**
     * Autoriza o rechaza una solicitud de vacaciones desde la notificación o buzón.
     */
    public function cambiarEstatus(Request $request)
    {
        try {
            $this->asegurarColumnas();

            $id = $request->input('id');
            $estatus = $request->input('estatus'); // 'Autorizado' o 'Rechazado'
            $motivo = $request->input('motivoRechazo', '');
            $idEmpleadoSolicitante = $request->input('idEmpleado');

            $vacacion = Vacacion::find($id);
            if (!$vacacion) {
                return response()->json(['error' => 'Solicitud no encontrada'], 404);
            }

            // Validar que exista jefe asignado: "si no hay jefe no aparezcan / no autorizar"
            if (empty($vacacion->idJefeInmediato)) {
                return response()->json('No se puede autorizar o rechazar esta solicitud porque no tiene un jefe inmediato asignado.', 400);
            }

            // Validar que solo el jefe asignado en ese momento pueda autorizar o rechazar
            if (!empty($idEmpleadoSolicitante) && intval($vacacion->idJefeInmediato) !== intval($idEmpleadoSolicitante)) {
                return response()->json('Solo el jefe inmediato asignado a esta solicitud tiene permiso para autorizarla o rechazarla.', 403);
            }

            $vacacion->estatus = $estatus;
            if ($estatus === 'Rechazado') {
                $vacacion->motivoRechazo = $motivo;
            }
            $vacacion->leido_jefe = 1;
            $vacacion->leido_empleado = 0; // Notificación nueva para el empleado informando el resultado
            $vacacion->fechaRespuesta = Carbon::now();
            $vacacion->save();

            $actualizado = Vacacion::join('empleados', 'vacaciones.idEmpleado', '=', 'empleados.id')
                ->leftJoin('puestos', 'empleados.idPuesto', '=', 'puestos.id')
                ->leftJoin('sucursales', 'empleados.idSucursal', '=', 'sucursales.id')
                ->select(
                    'vacaciones.*',
                    'empleados.nombre as empleado',
                    'puestos.nombre as puesto',
                    'sucursales.nombre as sucursal'
                )
                ->where('vacaciones.id', $vacacion->id)
                ->first();

            return response()->json(['ok' => true, 'vacacion' => $actualizado], 200);
        } catch (Exception $e) {
            return response()->json($e->getMessage(), 400);
        }
    }

    /**
     * Consulta el buzón de notificaciones (pendientes por autorizar y resoluciones)
     */
    public function notificaciones(Request $request)
    {
        try {
            $this->asegurarColumnas();

            $idEmpleado = $request->input('idEmpleado');
            $idTipoUsuario = intval($request->input('idTipoUsuario', 0));
            $esAdmin = ($idTipoUsuario === 1);

            // 1. Solicitudes pendientes que requieren autorización
            $queryPendientes = Vacacion::join('empleados', 'vacaciones.idEmpleado', '=', 'empleados.id')
                ->leftJoin('puestos', 'empleados.idPuesto', '=', 'puestos.id')
                ->leftJoin('sucursales', 'empleados.idSucursal', '=', 'sucursales.id')
                ->select(
                    'vacaciones.*',
                    'empleados.nombre as empleado',
                    'empleados.nombre as empleadoNombre',
                    'puestos.nombre as puesto',
                    'sucursales.nombre as sucursal'
                )
                ->where('vacaciones.eliminado', 0)
                ->where('vacaciones.estatus', 'Pendiente')
                // Solo si tiene jefe asignado: "si no hay jefe no aparezcan"
                ->whereNotNull('vacaciones.idJefeInmediato')
                ->where('vacaciones.idJefeInmediato', '>', 0);

            if (!empty($idEmpleado)) {
                // Solo al jefe que este asignado en ese momento
                $queryPendientes->where('vacaciones.idJefeInmediato', $idEmpleado);
            }

            $pendientes = $queryPendientes->orderBy('vacaciones.id', 'desc')->get();

            // 2. Notificaciones para el empleado (sus solicitudes aprobadas o rechazadas)
            $notificacionesEmpleado = collect();
            if (!empty($idEmpleado)) {
                $notificacionesEmpleado = Vacacion::where('idEmpleado', $idEmpleado)
                    ->whereIn('estatus', ['Autorizado', 'Rechazado'])
                    ->where('eliminado', 0)
                    ->orderBy('updated_at', 'desc')
                    ->take(20)
                    ->get();
            }

            // Conteo de no leídas
            $conteoPendientesNoLeidas = $pendientes->where('leido_jefe', 0)->count();
            $conteoEmpleadoNoLeidas = $notificacionesEmpleado->where('leido_empleado', 0)->count();

            // 3. Historial de todas las solicitudes para vista por día
            $queryHistorial = Vacacion::join('empleados', 'vacaciones.idEmpleado', '=', 'empleados.id')
                ->leftJoin('puestos', 'empleados.idPuesto', '=', 'puestos.id')
                ->leftJoin('sucursales', 'empleados.idSucursal', '=', 'sucursales.id')
                ->select(
                    'vacaciones.*',
                    'empleados.nombre as empleado',
                    'empleados.nombre as empleadoNombre',
                    'puestos.nombre as puesto',
                    'sucursales.nombre as sucursal'
                )
                ->where('vacaciones.eliminado', 0);

            if (!empty($idEmpleado)) {
                $queryHistorial->where(function ($q) use ($idEmpleado) {
                    $q->where('vacaciones.idJefeInmediato', $idEmpleado)
                      ->orWhere('vacaciones.idEmpleado', $idEmpleado);
                });
            }

            $historial = $queryHistorial->orderBy('vacaciones.updated_at', 'desc')->take(100)->get();

            return response()->json([
                'pendientes' => $pendientes,
                'porAutorizar' => $pendientes,
                'notificacionesEmpleado' => $notificacionesEmpleado,
                'misSolicitudes' => $notificacionesEmpleado,
                'conteoNoLeidas' => $conteoPendientesNoLeidas + $conteoEmpleadoNoLeidas,
                'historial' => $historial
            ], 200);
        } catch (Exception $e) {
            return response()->json($e->getMessage(), 400);
        }
    }

    /**
     * Marca notificaciones como leídas
     */
    public function marcarLeida(Request $request)
    {
        try {
            $this->asegurarColumnas();

            $id = $request->input('id');
            $rol = $request->input('rol', 'jefe'); // 'jefe' o 'empleado'
            $idEmpleado = $request->input('idEmpleado');

            if ($id === 'todas') {
                if ($rol === 'jefe' && $idEmpleado) {
                    Vacacion::where('idJefeInmediato', $idEmpleado)->update(['leido_jefe' => 1]);
                } else if ($idEmpleado) {
                    Vacacion::where('idEmpleado', $idEmpleado)->update(['leido_empleado' => 1]);
                }
            } else if ($id) {
                $vacacion = Vacacion::find($id);
                if ($vacacion) {
                    if ($rol === 'jefe') {
                        $vacacion->leido_jefe = 1;
                    } else {
                        $vacacion->leido_empleado = 1;
                    }
                    $vacacion->save();
                }
            }

            return response()->json(['ok' => true], 200);
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
