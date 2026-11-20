<?php

namespace App;

use Illuminate\Auth\Authenticatable;
use Illuminate\Contracts\Auth\Access\Authorizable as AuthorizableContract;
use Illuminate\Contracts\Auth\Authenticatable as AuthenticatableContract;
use Illuminate\Database\Eloquent\Model;
use Laravel\Lumen\Auth\Authorizable;
use App\Ingreso;
use App\Egreso;
use Illuminate\Support\Facades\DB;

class Cuenta extends Model implements AuthenticatableContract, AuthorizableContract
{
    use Authenticatable, Authorizable;

    protected $table = 'cuentas';

    protected $fillable = [
        'nombre',
        'cuenta',
        'activo',
        'eliminado'
    ];

    protected $hidden = [];

    protected $appends = [
        'totalIngresos',
        'totalEgresos',
        'totalFinal',
        'positivo',
        'lista_ingresos',
        'lista_egresos'
    ];

    public function ingresos()
    {
        return $this->hasMany(Ingreso::class, 'idCuenta', 'id');
    }

    public function egresos()
    {
        return $this->hasMany(Egreso::class, 'idCuenta', 'id');
    }

    public function getTotalIngresosAttribute()
    {
        return (float) Ingreso::where('idCuenta', $this->id)
            ->where('eliminado', 0)
            ->where('activo', 1)
            ->desdeBalanceActual()
            ->sum('monto');
    }

    public function getTotalEgresosAttribute()
    {
        return (float) Egreso::where('idCuenta', $this->id)
            ->where('idFormaPago', '!=', 1)
            ->where('eliminado', 0)
            ->where('activo', 1)
            ->desdeBalanceActual()
            ->sum('monto');
    }

    public function getListaIngresosAttribute()
    {
        return Ingreso::paraBalanceLista()
            ->where('ingresos.idCuenta', $this->id)
            ->get();
    }

    public function getListaEgresosAttribute()
    {
        return Egreso::paraBalanceLista()
            ->where('egresos.idCuenta', $this->id)
            ->where('egresos.idFormaPago', '!=', 1)
            ->get();
    }

    public function getTotalFinalAttribute()
    {
        return round(
            $this->totalIngresos - $this->totalEgresos,
            2
        );
    }

    public function getPositivoAttribute()
    {
        return $this->totalFinal >= 0; 
    }
}