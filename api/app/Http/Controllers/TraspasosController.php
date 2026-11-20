<?php

namespace App\Http\Controllers;

use App\Models\Traspaso;
use App\Calendario;
use App\Cuenta;
use App\Egreso;
use App\Ingreso;

use App\Clases\Consultas;
use Illuminate\Http\Request;
use Carbon\Carbon;
use Exception;
use Throwable;

class TraspasosController extends Controller
{
    function mostrar()
    {
        try {
            $datos = Traspaso::where('eliminado', '=', 0)->get();
            return response()->json($datos, 200);
        } catch (Exception $e) {
            return response()->json('Error en el servidor', 400);
        }
    }

    function nuevo(Request $request)
    {
        $transaccionIniciada = false;
        try {
            $datos = $this->validarDatosTraspaso($request);
            if (is_string($datos)) {
                return response()->json($datos, 400);
            }

            $calendarioId = $this->resolverCalendarioId($request->input('calendarioID') ?? $request->input('idCalendario'));
            $usuarioId = intval($request->input('usuarioID', 0));
            if ($usuarioId <= 0) {
                $usuarioId = intval(auth()->id() ?? 0);
            }

            Consultas::start();
            $transaccionIniciada = true;

            $egreso = Egreso::create([
                'concepto' => 'Traspaso',
                'monto' => $datos['monto'],
                'observaciones' => '',
                'idRubro' => 22,
                'idTipo' => 198,
                'idSucursal' => $datos['idSucursalOrigen'],
                'idSucursalGasto' => $datos['idSucursalOrigen'],
                'idCalendario' => $calendarioId,
                'idFormaPago' => $datos['idFormaPagoOrigen'],
                'idUsuario' => $usuarioId,
                'referencia' => 120,
                'idNivel' => 1,
                'idCuenta' => $datos['idCuentaOrigen'],
                'voucher' => '',
            ]);

            $ingreso = Ingreso::create([
                'concepto' => 'Traspaso',
                'monto' => $datos['monto'],
                'observaciones' => '',
                'idRubro' => 6,
                'idTipo' => 26,
                'idSucursal' => $datos['idSucursalDestino'],
                'idCalendario' => $calendarioId,
                'idFormaPago' => $datos['idFormaPagoDestino'],
                'idCuenta' => $datos['idCuentaDestino'],
                'idMetodoPago' => 1,
                'idUsuario' => $usuarioId,
                'referencia' => 120,
                'idNivel' => 1,
                'imagen' => '',
                'idBanco' => 0,
                'numeroReferencia' => '',
                'nombreCuenta' => '',
                'fecha' => Carbon::now()->toDateString(),
            ]);

            $traspaso = Traspaso::create([
                'idIngreso' => $ingreso->id,
                'idEgreso' => $egreso->id,
                'monto' => $datos['monto'],
                'idCuenta' => $datos['idCuentaDestino'],
                'idFormaPago' => $datos['idFormaPagoDestino'],
            ]);

            Consultas::commit();

            return response()->json($traspaso, 200);
        } catch (Throwable $e) {
            if ($transaccionIniciada) {
                Consultas::rollback();
            }
            return response()->json('Error en el servidor', 400);
        }
    }

    /**
     * Valida y normaliza el origen, destino y monto del traspaso.
     */
    private function validarDatosTraspaso(Request $request)
    {
        $egresoReq = $request->input('egreso', []);
        $ingresoReq = $request->input('ingreso', []);

        if (!is_array($egresoReq) || !is_array($ingresoReq)) {
            return 'Datos de traspaso inválidos';
        }

        $rawMonto = str_replace(',', '', trim((string) ($ingresoReq['monto'] ?? '')));
        if ($rawMonto === '' || !is_numeric($rawMonto) || floatval($rawMonto) <= 0) {
            return 'El monto del traspaso debe ser mayor a 0';
        }
        $monto = round(floatval($rawMonto), 2);

        $esEfectivo = filter_var($egresoReq['efectivo'] ?? false, FILTER_VALIDATE_BOOLEAN);

        if ($esEfectivo) {
            $idSucursalOrigen = intval($egresoReq['idSucursal'] ?? 10);
            if ($idSucursalOrigen <= 0) {
                $idSucursalOrigen = 10;
            }

            $idCuentaDestino = intval($ingresoReq['idCuenta'] ?? 0);
            if ($idCuentaDestino <= 0 || !Cuenta::where('id', $idCuentaDestino)->where('eliminado', 0)->exists()) {
                return 'Debes seleccionar una cuenta destino válida';
            }

            $idFormaPagoDestino = intval($ingresoReq['idFormaPago'] ?? 0);
            if ($idFormaPagoDestino <= 1) {
                $idFormaPagoDestino = 4;
            }

            return [
                'monto' => $monto,
                'idSucursalOrigen' => $idSucursalOrigen,
                'idSucursalDestino' => $idSucursalOrigen,
                'idFormaPagoOrigen' => 1,
                'idCuentaOrigen' => 0,
                'idFormaPagoDestino' => $idFormaPagoDestino,
                'idCuentaDestino' => $idCuentaDestino,
            ];
        }

        $idCuentaOrigen = intval($egresoReq['id'] ?? 0);
        if ($idCuentaOrigen <= 0 || !Cuenta::where('id', $idCuentaOrigen)->where('eliminado', 0)->exists()) {
            return 'La cuenta origen no es válida';
        }

        $idFormaPagoDestino = intval($ingresoReq['idFormaPago'] ?? 0);
        if ($idFormaPagoDestino <= 0) {
            return 'Debes seleccionar una forma de pago';
        }

        if ($idFormaPagoDestino === 1) {
            $idCuentaDestino = 0;
        } else {
            $idCuentaDestino = intval($ingresoReq['idCuenta'] ?? 0);
            if ($idCuentaDestino <= 0 || !Cuenta::where('id', $idCuentaDestino)->where('eliminado', 0)->exists()) {
                return 'Debes seleccionar una cuenta destino válida';
            }
            if ($idCuentaDestino === $idCuentaOrigen) {
                return 'La cuenta destino debe ser distinta a la cuenta origen';
            }
        }

        return [
            'monto' => $monto,
            'idSucursalOrigen' => 10,
            'idSucursalDestino' => 10,
            'idFormaPagoOrigen' => 4,
            'idCuentaOrigen' => $idCuentaOrigen,
            'idFormaPagoDestino' => $idFormaPagoDestino,
            'idCuentaDestino' => $idCuentaDestino,
        ];
    }

    /**
     * Garantiza un idCalendario válido y visible en los balances (>= 26 cuando exista).
     */
    private function resolverCalendarioId($calendarioSolicitado)
    {
        $id = intval($calendarioSolicitado);
        if ($id >= 26 && Calendario::where('id', $id)->where('eliminado', 0)->exists()) {
            return $id;
        }

        $hoy = Carbon::today()->toDateString();
        $vigente = Calendario::where('eliminado', 0)
            ->where('activo', 1)
            ->whereDate('inicio', '<=', $hoy)
            ->whereDate('fin', '>=', $hoy)
            ->orderBy('id', 'desc')
            ->first();

        if ($vigente && intval($vigente->id) >= 26) {
            return intval($vigente->id);
        }

        $ultimo = Calendario::where('eliminado', 0)
            ->where('activo', 1)
            ->where('id', '>=', 26)
            ->orderBy('id', 'desc')
            ->first();

        if ($ultimo) {
            return intval($ultimo->id);
        }

        return ($vigente) ? intval($vigente->id) : 26;
    }
}