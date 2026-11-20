<?php

namespace App;

use Illuminate\Auth\Authenticatable;
use Illuminate\Contracts\Auth\Access\Authorizable as AuthorizableContract;
use Illuminate\Contracts\Auth\Authenticatable as AuthenticatableContract;
use Illuminate\Database\Eloquent\Model;
use Laravel\Lumen\Auth\Authorizable;
use Carbon\Carbon;
use App\Sucursale;
use App\Vale;
use App\Alumnoabono;
use App\Calendario;
use App\Nivele;
use Illuminate\Support\Facades\DB; // <-- Agregado para usar DB::raw

class Ingreso extends Model implements AuthenticatableContract, AuthorizableContract
{
    use Authenticatable, Authorizable;

    public function getCreatedAtAttribute($value){
        return Carbon::parse($value)->format('d-m-Y');
    }
    
    public function getConceptoAttribute($value){
        $idRubro = isset($this->attributes['idRubro']) ? $this->attributes['idRubro'] : null;
        $idTipo = isset($this->attributes['idTipo']) ? $this->attributes['idTipo'] : null;
        if (intval($idRubro) === 1) {
            if (intval($idTipo) === 1) {
                return 'Inscripcion';
            }
            if (intval($idTipo) === 2) {
                return 'Abono';
            }
            if (empty($value)) {
                return 'Abono';
            }
        }
        return $value;
    }

    protected $fillable = [
        'id', 'concepto', 'monto', 'observaciones', 'idRubro', 'idTipo', 'idSucursal', 'idCalendario', 'idFormaPago', 'idMetodoPago', 'idUsuario', 'activo', 'eliminado', 'created_at', 'update_at', 'referencia', 'folio', 'idNivel', 'imagen', 'idBanco', 'nombreCuenta', 'numeroReferencia', 'idCuenta', 'fecha', 'auditado'
    ];

    protected $hidden = [];

    protected $attributes = [
        'activo' => 1,
        'eliminado' => 0
    ];

    protected static function boot()
    {
        parent::boot();

        static::creating(function ($ingreso) {

            if (is_null($ingreso->activo)) {
                $ingreso->activo = 1;
            }

            if (is_null($ingreso->eliminado)) {
                $ingreso->eliminado = 0;
            }

            if (empty($ingreso->folio)) {

                $cantidad = self::where('idNivel', $ingreso->idNivel)
                    ->where('idCalendario', $ingreso->idCalendario)
                    ->where('idSucursal', $ingreso->idSucursal)
                    ->count();

                $sucursal = Sucursale::find($ingreso->idSucursal);
                $calendario = Calendario::find($ingreso->idCalendario);
                $nivel = Nivele::find($ingreso->idNivel);

                if ($sucursal && $calendario && $nivel) {

                    $separados = explode('-', $calendario->nombre);

                    $ingreso->folio =
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
     * Construye el listado de ingresos para balance con las mismas columnas que Ingresos Generales.
     */
    public function scopeParaBalanceLista($query, array $extraColumns = [])
    {
        $columnas = array_merge([
            'ingresos.id',
        ], $extraColumns, [
            'ingresos.folio',
            DB::raw("COALESCE(n.nombre, '') as nivel"),
            DB::raw("COALESCE(c.nombre, '') as calendario"),
            DB::raw("COALESCE(s.nombre, '') as sucursal"),
            DB::raw('MONTHNAME(ingresos.created_at) as mes'),
            DB::raw("DATE_FORMAT(ingresos.created_at, '%Y-%m-%d') as fecha"),
            DB::raw("DATE_FORMAT(ingresos.created_at, '%H:%i:%s') as hora"),
            DB::raw("COALESCE(ri.nombre, '') as rubro"),
            DB::raw("(CASE
                WHEN (ingresos.idRubro = 1 AND ingresos.idTipo = 1) THEN 'Inscripcion'
                WHEN (ingresos.idRubro = 1 AND ingresos.idTipo = 2) THEN 'Abono'
                WHEN (ingresos.idRubro = 1 AND (ingresos.concepto IS NULL OR ingresos.concepto = '')) THEN 'Abono'
                ELSE ingresos.concepto
            END) as concepto"),
            DB::raw("COALESCE(fp.nombre, '') as forma"),
            DB::raw("CASE
                WHEN (ingresos.idCuenta = 0 OR ingresos.idCuenta IS NULL) THEN 'Efectivo'
                ELSE COALESCE(cuentas.nombre, 'Cuenta General')
            END as cuenta"),
            'ingresos.monto',
            'ingresos.activo',
        ]);

        return $query->leftJoin('calendarios as c', 'ingresos.idCalendario', '=', 'c.id')
            ->leftJoin('niveles as n', 'ingresos.idNivel', '=', 'n.id')
            ->leftJoin('sucursales as s', 'ingresos.idSucursal', '=', 's.id')
            ->leftJoin('rubros as ri', 'ingresos.idRubro', '=', 'ri.id')
            ->leftJoin('formaspagos as fp', 'ingresos.idFormaPago', '=', 'fp.id')
            ->leftJoin('cuentas', 'ingresos.idCuenta', '=', 'cuentas.id')
            ->select($columnas)
            ->where('ingresos.eliminado', 0)
            ->where('ingresos.activo', 1)
            ->desdeBalanceActual();
    }


    public function scopeReporteGeneralCalendario($query, $idCalendario)
    {
        return $query->from('ingresos as i')
            ->join('calendarios as c', 'i.idCalendario', '=', 'c.id')
            ->join('niveles as n', 'i.idNivel', '=', 'n.id')
            ->join('sucursales as s', 'i.idSucursal', '=', 's.id')
            ->join('rubros as ri', 'i.idRubro', '=', 'ri.id')
            ->join('formaspagos as fp', 'i.idFormaPago', '=', 'fp.id')
            ->select(
                'i.id',
                'i.folio',
                'n.nombre as nivel',
                'c.nombre as calendario',
                's.nombre as sucursal',
                DB::raw('MONTHNAME(i.created_at) as mes'),
                DB::raw("DATE_FORMAT(i.created_at, '%Y-%m-%d') as fecha"),
                DB::raw("DATE_FORMAT(i.created_at, '%H:%i:%s') as hora"),
                'ri.nombre as rubro',
                DB::raw("(CASE 
                    WHEN (i.idRubro = 1 AND i.idTipo = 1) THEN 'Inscripcion'
                    WHEN (i.idRubro = 1 AND i.idTipo = 2) THEN 'Abono'
                    ELSE i.concepto
                END) as concepto"),
                'fp.nombre as forma',
                // Replicamos exactamente tu condición: si es 0 o NULL es Efectivo, si no, busca en cuentas
                DB::raw("
                    IF((i.idCuenta = 0 OR i.idCuenta IS NULL), 
                        'Efectivo', 
                        (SELECT nombre FROM cuentas WHERE id = i.idCuenta)
                    ) as cuenta
                "),
                'i.monto',
                'i.activo'
            )
            ->where('i.idCalendario', $idCalendario);
    }

    public function scopeReporte($query, array $filtros)
    {
        return $query->from('ingresos as i')
            ->join('calendarios as c', 'i.idCalendario', '=', 'c.id')
            ->join('niveles as n', 'i.idNivel', '=', 'n.id')
            ->join('sucursales as s', 'i.idSucursal', '=', 's.id')
            ->join('rubros as ri', 'i.idRubro', '=', 'ri.id')
            ->join('formaspagos as fp', 'i.idFormaPago', '=', 'fp.id')
            ->select(
                'i.id',
                'i.folio',
                'n.nombre as nivel',
                'c.nombre as calendario',
                's.nombre as sucursal',
                DB::raw('MONTHNAME(i.created_at) as mes'),
                DB::raw("DATE_FORMAT(i.created_at, '%Y-%m-%d') as fecha"),
                DB::raw("DATE_FORMAT(i.created_at, '%H:%i:%s') as hora"),
                'ri.nombre as rubro',
                DB::raw("(CASE 
                    WHEN (i.idRubro = 1 AND i.idTipo = 1) THEN 'Inscripcion'
                    WHEN (i.idRubro = 1 AND i.idTipo = 2) THEN 'Abono'
                    ELSE i.concepto
                END) as concepto"),
                'fp.nombre as forma',
                DB::raw("
                    IF((i.idCuenta = 0 OR i.idCuenta IS NULL), 
                        'Efectivo', 
                        (SELECT nombre FROM cuentas WHERE id = i.idCuenta)
                    ) as cuenta
                "),
                'i.monto',
                'i.activo'
            )
            
            ->when(!empty($filtros['idCalendario']), function ($q) use ($filtros) {
                return $q->where('i.idCalendario', $filtros['idCalendario']);
            })
            ->when(!empty($filtros['idNivel']), function ($q) use ($filtros) {
                return $q->where('i.idNivel', $filtros['idNivel']);
            })
            ->when(!empty($filtros['idSucursal']), function ($q) use ($filtros) {
                return $q->where('i.idSucursal', $filtros['idSucursal']);
            })
            ->when(isset($filtros['activo']), function ($q) use ($filtros) { // Por si quieres filtrar activos/inactivos
                return $q->where('i.activo', $filtros['activo']);
            });
    }
}