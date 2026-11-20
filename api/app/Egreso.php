<?php

namespace App;

use Illuminate\Auth\Authenticatable;
use Illuminate\Contracts\Auth\Access\Authorizable as AuthorizableContract;
use Illuminate\Contracts\Auth\Authenticatable as AuthenticatableContract;
use Illuminate\Database\Eloquent\Model;
use Laravel\Lumen\Auth\Authorizable;
use App\Sucursale;
use App\Calendario;
use App\Nivele;
use Illuminate\Support\Facades\DB;

class Egreso extends Model implements AuthenticatableContract, AuthorizableContract
{
    use Authenticatable, Authorizable;

    protected $fillable = [
        'id',
        'concepto',
        'monto',
        'observaciones',
        'idRubro',
        'idTipo',
        'idSucursal',
        'idCalendario',
        'idFormaPago',
        'idUsuario',
        'activo',
        'eliminado',
        'created_at',
        'update_at',
        'referencia',
        'idNivel',
        'folio',
        'idCuenta',
        'voucher',
        'idSucursalGasto'
    ];

    protected $hidden = [];

    protected static function boot()
    {
        parent::boot();

        static::saving(function ($egreso) {
            if ((int)$egreso->idFormaPago === 1) {
                $egreso->idCuenta = 0;
            }
        });

        static::creating(function ($egreso) {

            if (empty($egreso->folio)) {

                $cantidad = self::where('idNivel', $egreso->idNivel)
                    ->where('idCalendario', $egreso->idCalendario)
                    ->where('idSucursal', $egreso->idSucursal)
                    ->count();

                $sucursal = Sucursale::find($egreso->idSucursal);
                $calendario = Calendario::find($egreso->idCalendario);
                $nivel = Nivele::find($egreso->idNivel);

                if ($sucursal && $calendario && $nivel) {

                    $separados = explode('-', $calendario->nombre);

                    $egreso->folio =
                        substr($separados[0], -2) .
                        $separados[1] .
                        substr($nivel->nombre, 0, 1) .
                        $sucursal->abreviatura .
                        '-' .
                        ($cantidad + 1);
                }
            }
        });
    }

    protected $attributes = [
        'activo' => 1,
        'eliminado' => 0
    ];

    /**
     * Incluye registros desde el calendario base de balances (26) y traspasos (referencia 120).
     */
    public function scopeDesdeBalanceActual($query)
    {
        return $query->where(function ($q) {
            $q->where('idCalendario', '>=', 26)
              ->orWhere('referencia', 120);
        });
    }

    /**
     * Construye el listado de egresos para balance con las mismas columnas que Egresos Generales,
     * anexando el departamento y nombre del empleado en nóminas.
     */
    public function scopeParaBalanceLista($query, array $extraColumns = [])
    {
        $nominaEmpleados = DB::table('nominaegresos as ne')
            ->join('nominas as n', 'n.id', '=', 'ne.idNomina')
            ->join('empleados as emp', 'emp.id', '=', 'n.idEmpleado')
            ->leftJoin('departamentos as dep', 'dep.id', '=', 'n.idDepartamento')
            ->select(
                'ne.idEgreso',
                DB::raw('MAX(emp.nombre) as empleado'),
                DB::raw('MAX(dep.nombre) as departamento')
            )
            ->where(function ($q) {
                $q->where('ne.eliminado', 0)->orWhereNull('ne.eliminado');
            })
            ->groupBy('ne.idEgreso');

        $columnas = array_merge([
            'egresos.id',
        ], $extraColumns, [
            'egresos.folio',
            DB::raw("COALESCE(n.nombre, '') as nivel"),
            DB::raw("COALESCE(c.nombre, '') as calendario"),
            DB::raw("COALESCE(s.nombre, '') as sucursalCaptura"),
            DB::raw("COALESCE(sg.nombre, 'NA') as sucursalEgreso"),
            DB::raw('MONTHNAME(egresos.created_at) as mes'),
            DB::raw("DATE_FORMAT(egresos.created_at, '%Y-%m-%d') as fecha"),
            DB::raw("DATE_FORMAT(egresos.created_at, '%H:%i:%s') as hora"),
            DB::raw("COALESCE(re.nombre, '') as rubro"),
            DB::raw("CASE
                WHEN te.nombre = 'Nominas' AND ne_emp.departamento IS NOT NULL AND ne_emp.departamento != ''
                    THEN ne_emp.departamento
                ELSE COALESCE(te.nombre, '')
            END as tipo"),
            DB::raw("CASE
                WHEN ne_emp.empleado IS NOT NULL AND ne_emp.empleado != ''
                    THEN IF(COALESCE(egresos.concepto, '') = '', ne_emp.empleado, CONCAT(egresos.concepto, ' - ', ne_emp.empleado))
                ELSE egresos.concepto
            END as concepto"),
            DB::raw("COALESCE(fp.nombre, '') as forma"),
            DB::raw("CASE
                WHEN egresos.idFormaPago = 1 THEN 'Efectivo'
                WHEN (egresos.idCuenta = 0 OR egresos.idCuenta IS NULL) THEN 'Efectivo'
                ELSE COALESCE(cuentas.nombre, 'Cuenta General')
            END as cuenta"),
            'egresos.monto',
            'egresos.activo',
        ]);

        return $query->leftJoin('calendarios as c', 'egresos.idCalendario', '=', 'c.id')
            ->leftJoin('niveles as n', 'egresos.idNivel', '=', 'n.id')
            ->leftJoin('sucursales as s', 'egresos.idSucursal', '=', 's.id')
            ->leftJoin('sucursales as sg', 'egresos.idSucursalGasto', '=', 'sg.id')
            ->leftJoin('rubrosegresos as re', 'egresos.idRubro', '=', 're.id')
            ->leftJoin('tiposegresos as te', 'egresos.idTipo', '=', 'te.id')
            ->leftJoin('formaspagos as fp', 'egresos.idFormaPago', '=', 'fp.id')
            ->leftJoin('cuentas', 'egresos.idCuenta', '=', 'cuentas.id')
            ->select($columnas)
            ->leftJoinSub($nominaEmpleados, 'ne_emp', function ($join) {
                $join->on('ne_emp.idEgreso', '=', 'egresos.id');
            })
            ->where('egresos.eliminado', 0)
            ->where('egresos.activo', 1)
            ->desdeBalanceActual();
    }

    //Funciones Scope para reportes

    /**
     * Scope escalable para reportes de egresos con filtros dinámicos
     */
    public function scopeReporte($query, array $filtros)
    {
        return $query->from('egresos as e')
            ->join('calendarios as c', 'e.idCalendario', '=', 'c.id')
            ->join('niveles as n', 'e.idNivel', '=', 'n.id')
            ->join('sucursales as s', 'e.idSucursal', '=', 's.id')
            ->leftJoin('sucursales as sg', 'e.idSucursalGasto', '=', 'sg.id')
            ->join('rubrosegresos as re', 'e.idRubro', '=', 're.id')
            ->join('tiposegresos as te', 'e.idTipo', '=', 'te.id')
            ->join('formaspagos as fp', 'e.idFormaPago', '=', 'fp.id')
            ->select(
                'e.id',
                'e.folio',
                'n.nombre as nivel',
                'c.nombre as calendario',
                's.nombre as sucursalCaptura',
                DB::raw("COALESCE(sg.nombre, 'NA') as sucursalEgreso"),
                DB::raw('MONTHNAME(e.created_at) as mes'),
                DB::raw("DATE_FORMAT(e.created_at, '%Y-%m-%d') as fecha"),
                DB::raw("DATE_FORMAT(e.created_at, '%H:%i:%s') as hora"),
                're.nombre as rubro',
                'te.nombre as tipo',
                'e.concepto',
                'fp.nombre as forma',
                DB::raw("
                    IF((e.idCuenta = 0 OR e.idCuenta IS NULL), 
                        'Efectivo', 
                        COALESCE((SELECT nombre FROM cuentas WHERE id = e.idCuenta), 'Cuenta General')
                    ) as cuenta
                "),
                'e.monto',
                'e.activo'
            )
            /* =======================================================
               BLOQUE DE FILTROS DINÁMICOS PARA EGRESOS
               ======================================================= */
            ->when(!empty($filtros['idCalendario']), function ($q) use ($filtros) {
                return $q->where('e.idCalendario', $filtros['idCalendario']);
            })
            ->when(!empty($filtros['idNivel']), function ($q) use ($filtros) {
                return $q->where('e.idNivel', $filtros['idNivel']);
            })
            ->when(!empty($filtros['idSucursal']), function ($q) use ($filtros) {
                return $q->where('e.idSucursal', $filtros['idSucursal']);
            })
            ->when(!empty($filtros['idSucursalGasto']), function ($q) use ($filtros) {
                return $q->where('e.idSucursalGasto', $filtros['idSucursalGasto']);
            })
            ->when(isset($filtros['activo']), function ($q) use ($filtros) {
                return $q->where('e.activo', $filtros['activo']);
            });
    }
}