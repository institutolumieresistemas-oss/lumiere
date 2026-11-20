<?php

namespace App\Models;

use App\Empleado;
use App\Formaspago;
use App\Cuenta;
use App\Egreso;
use App\Calendario;
use Illuminate\Database\Eloquent\Model;

class Prestamo extends Model
{
    // Nombre de la tabla
    protected $table = 'prestamos';

    // Llave primaria
    protected $primaryKey = 'id';

    // Auto-incremento
    public $incrementing = true;

    // Tipos de la llave primaria
    protected $keyType = 'int';

    // Timestamps activados
    public $timestamps = true;

    protected $fillable = [
        'idEmpleado',
        'idFormaPago',
        'idCuenta',
        'idEgreso',
        'idCalendario', // <-- NUEVO CAMPO AGREGADO
        'monto',
        'activo',
        'eliminado',
    ];

    protected $attributes = [
        'activo' => 1,
        'eliminado' => 0
    ];

    protected $appends = [
        'empleado',
        'forma',
        'cuenta',
        'egreso',
        'abonos',
        'abonoTotal',
        'saldo',
        'estatus',
        'bg',
        'calendario'
    ];

    // ==========================================
    // RELACIONES (Eloquent Relationships)
    // ==========================================

    public function RelEmpleado()
    {
        return $this->belongsTo(Empleado::class, 'idEmpleado');
    }

    public function RelFormaPago()
    {
        return $this->belongsTo(Formaspago::class, 'idFormaPago');
    }

    public function RelCuenta()
    {
        return $this->belongsTo(Cuenta::class, 'idCuenta');
    }

    public function RelEgreso()
    {
        return $this->belongsTo(Egreso::class, 'idEgreso');
    }

    public function RelAbonos()
    {
        return $this->hasMany(Prestamoabono::class, 'idPrestamo');
    }

    public function RelCalendario()
    {
        return $this->belongsTo(Calendario::class, 'idCalendario');
    }

    // ==========================================
    // ACCESORES (Mutators / Appends)
    // ==========================================

    public function getEmpleadoAttribute()
    {
        return optional($this->RelEmpleado)->nombre;
    }

    public function getFormaAttribute()
    {
        return optional($this->RelFormaPago)->nombre;
    }

    public function getCuentaAttribute()
    {
        return optional($this->RelCuenta)->nombre ?: 'Efectivo';
    }

    public function getEgresoAttribute()
    {
        return optional($this->RelEgreso)->folio;
    }

    public function getAbonosAttribute()
    {
        return $this->RelAbonos()
            ->where('eliminado', 0)
            ->sum('monto');
    }

    public function getCalendarioAttribute()
    {
        return optional($this->RelCalendario)->nombre;
    }

    public function getAbonoTotalAttribute()
    {
        return $this->RelAbonos()
            ->where('eliminado', 0)
            ->sum('monto');
    }

    public function getSaldoAttribute()
    {
        return $this->monto - $this->abonoTotal;
    }

    public function getEstatusAttribute()
    {
        return $this->abonoTotal >= $this->monto
            ? 'PAGADO'
            : 'ACTIVO';
    }

    public function getBgAttribute()
    {
        return $this->abonoTotal >= $this->monto
            ? 'bg-verde'
            : 'bg-rojo';
    }
}