<?php

namespace App\Http\Controllers;
use App\Ingreso;
use App\Egreso;
use App\Formaspago;
use App\Vale;
use App\Valeadministrativo;
use App\Sucursale;
use App\Cuenta;
use App\Clases\Balances;
use App\Clases\Ingresos;
use App\Clases\Egresos;
use App\Cuentacorte;
use Carbon\Carbon;

use Laravel\Lumen\Routing\Controller as BaseController;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;

class BalancesucursalesController extends BaseController
{
    function mostrar(Request $request){
        try{
          $funciones = new Balances();

          $administrativo = floatval($funciones->total($request['id'])) - floatval($funciones->administrativo($request['id']));
          $respuesta['total'] = number_format($administrativo, 2, '.', ',');
          $respuesta['vales'] = number_format($funciones->vales($request['id']), 2, '.', ',');
          $respuesta['administrativo'] = number_format($funciones->administrativo($request['id']));
          $respuesta['existe'] = $funciones->existeValeAdministrativo($request['id'] ?? $request['sucursalID']);
          $respuesta['cuentas'] = Cuenta::where('eliminado', '=', 0)->get();

          return response()->json($respuesta, 200);
        }catch(Exception $e){
            return response()->json("Error en el servidor", 400);
        }
    }

    function corte(Request $request){
        try{
          $funciones = new Balances();
          $respuesta = array();

          $sucursalId = $request['id'] ?? $request['sucursalID'];
          $usuarioId = $request['usuarioID'];

          $respuesta['ingresos'] = $funciones->ingresosAdministrativo($sucursalId, $usuarioId);

          $respuesta['egresos'] = $funciones->egresosAdministrativo($sucursalId, $usuarioId);

          $total = floatval($funciones->total($request['id'])) - floatval($funciones->administrativo($request['id']));
          $respuesta['total'] = number_format($total, 2, '.', ',');
          $respuesta['existe'] = $funciones->existeValeAdministrativo($request['id'] ?? $request['sucursalID']);
          $respuesta['vales'] = number_format($funciones->vales($request['id']), 2, '.', ',');
          $respuesta['administrativo'] = number_format($funciones->administrativo($request['id']));

          return response()->json($respuesta, 200);
        }catch(Exception $e){
            return response()->json("Error en el servidor", 400);
        }
    }

    function nuevoVale(Request $request){
      try {
        $funciones = new Balances();
        $vale = $funciones->crearValeAdministrativo($request['sucursalID']);
        return response()->json($vale, 200);
      } catch (Exception $e) {
        return response()->json('Error en el servidor', 400);
      }
    }

    function saldoVale(Request $request){
      try {
        $funciones = new Balances();
        
        $total = floatval($funciones->total($request['sucursalID'])) - floatval($funciones->administrativo($request['sucursalID']));
        if($total < floatval($request['monto'])){
          return response()->json('No cuentas con suficiente efectivo para realizar este vale', 400);
        }

        $vale = Valeadministrativo::where('idSucursal', '=', $request['sucursalID'])->get()[0];
        $vale->monto = floatval($vale->monto) + floatval($request['monto']);
        $vale->save();

        return response()->json($vale, 200);
      } catch (Exception $e) {
        return response()->json('Error en el servidor', 400);
      }
    }

    function saldoCaja(Request $request){
      try {
        $funciones = new Balances();

        $vale = Valeadministrativo::where('idSucursal', '=', $request['sucursalID'])->get()[0];
        $vale->monto = floatval($vale->monto) - floatval($request['monto']);
        $vale->save();

        return response()->json($vale, 200);
      } catch (Exception $e) {
        return response()->json('Error en el servidor', 400);
      }
    }

    function cuentas(){
      try {
        $sucursales = Sucursale::where('activo', 1)->where('eliminado', 0)->get();

        $allIngresos = Ingreso::paraBalanceLista(['ingresos.idSucursal'])
        ->where('ingresos.idFormaPago', 1)
        ->get()
        ->groupBy('idSucursal');

        $allEgresos = Egreso::paraBalanceLista(['egresos.idSucursal'])
        ->where('egresos.idFormaPago', 1)
        ->get()
        ->groupBy('idSucursal');

        $allVales = Valeadministrativo::select(
            'id',
            'idSucursal',
            DB::raw("COALESCE(DATE_FORMAT(created_at, '%Y-%m-%d'), DATE_FORMAT(updated_at, '%Y-%m-%d'), '') as fecha"),
            DB::raw("CONCAT('VALE-', id) as folio"),
            DB::raw("'Vale Administrativo' as concepto"),
            'monto'
        )
        ->where('eliminado', 0)
        ->where('activo', 1)
        ->get()
        ->groupBy('idSucursal');

        foreach ($sucursales as $s) {
            $s->lista_ingresos = $allIngresos->get($s->id, collect([]))->values();
            $s->lista_egresos = $allEgresos->get($s->id, collect([]))->values();
            $s->lista_vales = $allVales->get($s->id, collect([]))->values();
            $s->positivo = ($s->total_final >= 0);
        }

        return response()->json(array(
          'cuentas' => Cuenta::where('eliminado', '=', 0)->get(),
          'sucursales' => $sucursales,
          'formas' => Formaspago::where('eliminado', '=', 0)->where('activo', '=', 1)->get()
        ), 200);
      } catch (Exception $e) {
        return response()->json('Error en el servidor', 400);
      }
    }

    function nuevoCorte(Request $request){
      try {
        $cuenta = Cuenta::find($request['idCuenta']);
        $corte = Cuentacorte::create([
          'fecha' => Carbon::now(),
          'idCuenta' => $request['idCuenta'],
          'monto' => $cuenta->totalFinal
        ]);

        return response()->json($corte, 200);
      } catch (Exception $e) {
        return response()->json('Error en el servidor', 400);
      }
    }
}