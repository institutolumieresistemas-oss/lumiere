<?php

namespace App\Http\Controllers;

use App\Credito;
use App\Ingreso;
use App\Egreso;
use App\Calendario;
use App\Prestador;
use App\Models\Prestamo;
use App\Models\Prestamoabono;
use Illuminate\Http\Request;
use Carbon\Carbon;
use Illuminate\Support\Facades\DB;
use Exception;

class BalanceCalendariosController extends Controller
{
    public function obtenerBalances(Request $request)
    {
        try {
            // Obtener calendarios de ID 25 en adelante
            $calendarios = Calendario::where('id', '>=', 25)
                ->where('eliminado', 0)
                ->where('activo', 1)
                ->orderBy('id', 'asc')
                ->get();

            // Cachear nombres de todos los calendarios y prestadores para evitar consultas N+1
            $calendariosNombres = Calendario::pluck('nombre', 'id')->all();
            $prestadoresNombres = Prestador::pluck('nombre', 'id')->all();

            $resultado = [];

            foreach ($calendarios as $cal) {
                $idCal = $cal->id;
                $inicio = Carbon::parse($cal->inicio)->startOfDay()->toDateTimeString();
                $fin = Carbon::parse($cal->fin)->endOfDay()->toDateTimeString();

                // 1. Ingresos Reales (Omitir referencia 4 y 5)
                $ingresosReales = Ingreso::where('idCalendario', $idCal)
                    ->where('eliminado', 0)
                    ->where('activo', 1)
                    ->whereNotIn('referencia', [4, 5])
                    ->sum('monto');

                // 2. Egresos Reales (Omitir referencia 4 y 5)
                $egresosReales = Egreso::where('idCalendario', $idCal)
                    ->where('eliminado', 0)
                    ->where('activo', 1)
                    ->whereNotIn('referencia', [4, 5])
                    ->sum('monto');

                // 3. Cuentas por Cobrar del Calendario
                // A. Créditos cruzados a favor (idPrestador = idCal, tipo = 2, idCalendario != idCal)
                $creditosCruzados = Credito::where('eliminado', 0)
                    ->where('activo', 1)
                    ->where('idPrestador', $idCal)
                    ->where('idCalendario', '!=', $idCal)
                    ->where('tipo', 2)
                    ->get()
                    ->sum(function ($credito) {
                        return $credito->saldo;
                    });

                // B. Ingresos cruzados a favor
                // Ingresos con nuestro idCalendario, pero cuya fecha cae en el rango de fechas de otro calendario
                $ingresosAFavor = DB::table('ingresos as i')
                    ->join('calendarios as c', function ($join) use ($idCal) {
                        $join->on('i.fecha', '>=', DB::raw("DATE_FORMAT(c.inicio, '%Y-%m-%d 00:00:00')"))
                             ->on('i.fecha', '<=', DB::raw("DATE_FORMAT(c.fin, '%Y-%m-%d 23:59:59')"))
                             ->where('c.id', '!=', $idCal);
                    })
                    ->where('i.eliminado', 0)
                    ->where('i.activo', 1)
                    ->where('i.idCalendario', $idCal)
                    ->whereNotIn('i.referencia', [100, 110])
                    ->sum('i.monto');

                // C. Abonos de préstamos cruzados a favor
                $abonosAFavor = Prestamoabono::where('eliminado', 0)
                    ->where('activo', 1)
                    ->where('idCalendario', '!=', $idCal)
                    ->whereHas('RelPrestamo', function ($query) use ($idCal) {
                        $query->where('idCalendario', $idCal);
                    })
                    ->sum('monto');

                $totalCuentasCobrar = $creditosCruzados + $ingresosAFavor + $abonosAFavor;

                // 4. Cuentas por Pagar del Calendario
                // A. Créditos directos que debemos
                $creditosPagar = Credito::where('eliminado', 0)
                    ->where('activo', 1)
                    ->where('idCalendario', $idCal)
                    ->get()
                    ->sum(function ($credito) {
                        return $credito->saldo;
                    });

                // B. Ingresos cruzados en contra
                // Ingresos con idCalendario != nuestro, pero cuya fecha cae en nuestro rango de fechas
                $ingresosEnContra = DB::table('ingresos as i')
                    ->where('i.eliminado', 0)
                    ->where('i.activo', 1)
                    ->where('i.idCalendario', '!=', $idCal)
                    ->whereNotIn('i.referencia', [100, 110])
                    ->whereBetween('i.fecha', [$inicio, $fin])
                    ->sum('i.monto');

                // C. Abonos cruzados en contra
                $abonosEnContra = Prestamoabono::where('eliminado', 0)
                    ->where('activo', 1)
                    ->where('idCalendario', $idCal)
                    ->whereHas('RelPrestamo', function ($query) use ($idCal) {
                        $query->where('idCalendario', '!=', $idCal);
                    })
                    ->sum('monto');

                $totalCuentasPagar = $creditosPagar + $ingresosEnContra + $abonosEnContra;

                // 5. Utilidad Real
                $utilidadReal = ($ingresosReales + $totalCuentasCobrar) - ($egresosReales + $totalCuentasPagar);

                $resultado[] = [
                    'id' => $cal->id,
                    'calendario' => $cal->nombre,
                    'ingresosReales' => $ingresosReales,
                    'egresosReales' => $egresosReales,
                    'cuentasCobrar' => $totalCuentasCobrar,
                    'cuentasPagar' => $totalCuentasPagar,
                    'utilidadReal' => $utilidadReal
                ];
            }

            return response()->json($resultado, 200);

        } catch (Exception $e) {
            return response()->json($e->getMessage(), 500);
        }
    }
}
