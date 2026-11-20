<?php

namespace App;

use Illuminate\Database\Eloquent\Model;

class Vacacion extends Model
{
    protected $table = 'vacaciones';

    protected $fillable = [
        'idEmpleado',
        'jefeInmediato',
        'fechaInicio',
        'fechaFin',
        'diasEfectivos',
        'diasNaturales',
        'diasDescanso',
        'observaciones',
        'estatus',
        'activo',
        'eliminado'
    ];

    public function empleado()
    {
        return $this->belongsTo(Empleado::class, 'idEmpleado');
    }
}
