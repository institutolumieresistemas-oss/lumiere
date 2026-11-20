<?php

namespace App\Http\Controllers;

use App\Credito;
use App\Ingreso;
use App\Calendario;
use App\Prestador;
use App\Models\Prestamo;
use App\Models\Prestamoabono;
use Illuminate\Http\Request;
use Carbon\Carbon;
use Illuminate\Support\Facades\DB;
use Exception;

class CuentasCobrarController extends Controller
{
    /**
     * Cuentas por Cobrar (Lo que otros nos deben a nosotros)
     * 
     * 1. Créditos cruzados: Créditos otorgados por nuestro calendario a otros calendarios 
     *    (tipo = 2, idPrestador = idOtroCalendario, idCalendario = idNuestro)
     * 2. Ingresos cruzados a favor: Ingresos con NUESTRO idCalendario, pero cuya fecha cae en el rango de OTRO calendario 
     *    (el otro cobró físicamente dinero de nuestro calendario)
     * 3. Abonos cruzados a favor: Abonos cobrados en otro calendario pero que pertenecen a un préstamo de nuestro calendario
     */
    public function obtenerCuentasCobrar(Request $request)
    {
        try {
            $idCalendario = $request->input('idCalendario');
            if (!$idCalendario) {
                return response()->json('El ID de calendario es requerido', 400);
            }

            $calendario = Calendario::find($idCalendario);
            if (!$calendario) {
                return response()->json('Calendario no encontrado', 404);
            }

            // Cachear nombres de calendarios para evitar N+1
            $calendariosNombres = Calendario::pluck('nombre', 'id')->all();

            // 1. Créditos cruzados (Créditos hechos a otros calendarios)
            // Cuando nuestro calendario (idPrestador = idCalendario) le prestó a otro calendario (idCalendario != nuestro)
            // y el tipo de prestador es calendario (tipo = 2)
            $creditosCruzadosRaw = Credito::where('eliminado', 0)
                ->where('activo', 1)
                ->where('idPrestador', $idCalendario)
                ->where('idCalendario', '!=', $idCalendario)
                ->where('tipo', 2)
                ->get();

            $creditosCruzados = [];
            foreach ($creditosCruzadosRaw as $credito) {
                if ($credito->saldo > 0) {
                    $nombreCalendarioDeudor = $calendariosNombres[$credito->idCalendario] ?? 'Calendario no encontrado';

                    $creditosCruzados[] = [
                        'id' => $credito->id,
                        'monto' => $credito->monto,
                        'saldo' => $credito->saldo,
                        'deudor' => $nombreCalendarioDeudor,
                        'observaciones' => $credito->observaciones,
                        'fecha' => $credito->created_at ? $credito->created_at->format('Y-m-d') : null
                    ];
                }
            }

            // 2. Ingresos cruzados a favor (Optimizado en una sola consulta)
            // Ingresos con nuestro idCalendario, pero cuya fecha cae en el rango de fechas de otro calendario
            $ingresosAFavor = DB::table('ingresos as i')
                ->join('calendarios as c', function ($join) use ($idCalendario) {
                    $join->on('i.fecha', '>=', DB::raw("DATE_FORMAT(c.inicio, '%Y-%m-%d 00:00:00')"))
                         ->on('i.fecha', '<=', DB::raw("DATE_FORMAT(c.fin, '%Y-%m-%d 23:59:59')"))
                         ->where('c.id', '!=', $idCalendario);
                })
                ->select('i.id', 'i.folio', 'i.concepto', 'i.monto', 'i.fecha', 'c.nombre as calendarioDondeSeCobro')
                ->where('i.eliminado', 0)
                ->where('i.activo', 1)
                ->where('i.idCalendario', $idCalendario)
                ->whereNotIn('i.referencia', [100, 110])
                ->get();

            // 3. Abonos de préstamos cruzados a favor
            $abonosAFavor = Prestamoabono::where('eliminado', 0)
                ->where('activo', 1)
                ->where('idCalendario', '!=', $idCalendario)
                ->whereHas('RelPrestamo', function ($query) use ($idCalendario) {
                    $query->where('idCalendario', $idCalendario);
                })
                ->with(['RelPrestamo'])
                ->get()
                ->map(function ($abono) use ($calendariosNombres) {
                    $prestamo = $abono->RelPrestamo;
                    return [
                        'id' => $abono->id,
                        'monto' => $abono->monto,
                        'prestamo_id' => $abono->idPrestamo,
                        'prestamo_monto' => $prestamo->monto,
                        'empleado' => $abono->empleado,
                        'calendarioDondeSeCobro' => $calendariosNombres[$abono->idCalendario] ?? 'Otro'
                    ];
                });

            return response()->json([
                'creditosCruzados' => $creditosCruzados,
                'ingresosCruzados' => $ingresosAFavor,
                'abonosCruzados' => $abonosAFavor
            ], 200);

        } catch (Exception $e) {
            return response()->json($e->getMessage(), 500);
        }
    }

    /**
     * Cuentas por Pagar (Lo que debemos nosotros)
     * 
     * 1. Créditos directos que debemos
     * 2. Ingresos cruzados en contra: Ingresos con idCalendario DIFERENTE al nuestro, pero cuya fecha cae en nuestro periodo 
     *    (cobramos físicamente el dinero de inscripciones a otro calendario futuro/diferente)
     * 3. Abonos cruzados en contra: Abonos cobrados bajo nuestro idCalendario, pero asociados a préstamos de otros calendarios
     */
    public function obtenerCuentasPagar(Request $request)
    {
        try {
            $idCalendario = $request->input('idCalendario');
            if (!$idCalendario) {
                return response()->json('El ID de calendario es requerido', 400);
            }

            $calendario = Calendario::find($idCalendario);
            if (!$calendario) {
                return response()->json('Calendario no encontrado', 404);
            }

            $inicio = Carbon::parse($calendario->inicio)->startOfDay()->toDateTimeString();
            $fin = Carbon::parse($calendario->fin)->endOfDay()->toDateTimeString();

            // Cachear nombres de calendarios y prestadores
            $calendariosNombres = Calendario::pluck('nombre', 'id')->all();
            $prestadoresNombres = Prestador::pluck('nombre', 'id')->all();

            // 1. Créditos directos que debemos
            $creditosRaw = Credito::where('eliminado', 0)
                ->where('activo', 1)
                ->where('idCalendario', $idCalendario)
                ->get();

            $creditos = [];
            foreach ($creditosRaw as $credito) {
                if ($credito->saldo > 0) {
                    $nombrePrestador = '';
                    if ($credito->tipo == 2) {
                        $nombrePrestador = $calendariosNombres[$credito->idPrestador] ?? 'Calendario no encontrado';
                    } elseif ($credito->tipo == 1) {
                        $nombrePrestador = $prestadoresNombres[$credito->idPrestador] ?? 'Prestador no encontrado';
                    }

                    $creditos[] = [
                        'id' => $credito->id,
                        'monto' => $credito->monto,
                        'saldo' => $credito->saldo,
                        'tipo' => $credito->tipo,
                        'nombrePrestador' => $nombrePrestador,
                        'observaciones' => $credito->observaciones,
                        'fecha' => $credito->created_at ? $credito->created_at->format('Y-m-d') : null
                    ];
                }
            }

            // 2. Ingresos cruzados en contra (Optimizado en una sola consulta)
            // Ingresos con idCalendario != nuestro, pero cuya fecha de creación cae en nuestro rango de fechas (el dinero físico entró en nuestro periodo)
            $ingresosEnContra = DB::table('ingresos as i')
                ->join('calendarios as c', 'i.idCalendario', '=', 'c.id')
                ->select('i.id', 'i.folio', 'i.concepto', 'i.monto', 'i.fecha', 'c.nombre as calendarioOriginal')
                ->where('i.eliminado', 0)
                ->where('i.activo', 1)
                ->where('i.idCalendario', '!=', $idCalendario)
                ->whereNotIn('i.referencia', [100, 110])
                ->whereBetween('i.fecha', [$inicio, $fin])
                ->get();

            // 3. Abonos cruzados en contra
            $abonosEnContra = Prestamoabono::where('eliminado', 0)
                ->where('activo', 1)
                ->where('idCalendario', $idCalendario)
                ->whereHas('RelPrestamo', function ($query) use ($idCalendario) {
                    $query->where('idCalendario', '!=', $idCalendario);
                })
                ->with(['RelPrestamo'])
                ->get()
                ->map(function ($abono) use ($calendariosNombres) {
                    $prestamo = $abono->RelPrestamo;
                    return [
                        'id' => $abono->id,
                        'monto' => $abono->monto,
                        'prestamo_id' => $abono->idPrestamo,
                        'prestamo_monto' => $prestamo->monto,
                        'empleado' => $abono->empleado,
                        'calendarioPrestamo' => $calendariosNombres[$prestamo->idCalendario] ?? 'Otro'
                    ];
                });

            return response()->json([
                'creditos' => $creditos,
                'ingresosCruzados' => $ingresosEnContra,
                'abonosCruzados' => $abonosEnContra
            ], 200);

        } catch (Exception $e) {
            return response()->json($e->getMessage(), 500);
        }
    }
}
