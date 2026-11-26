<?php

namespace App;

use Illuminate\Database\Eloquent\Model;

class Vacacion extends Model
{
    protected $table = 'vacaciones';

    protected $fillable = [
        'idEmpleado',
        'idJefeInmediato',
        'jefeInmediato',
        'fechaInicio',
        'fechaFin',
        'diasEfectivos',
        'diasNaturales',
        'diasDescanso',
        'observaciones',
        'motivoRechazo',
        'estatus',
        'leido_jefe',
        'leido_empleado',
        'fechaRespuesta',
        'activo',
        'eliminado'
    ];

    public function empleado()
    {
        return $this->belongsTo(Empleado::class, 'idEmpleado');
    }

    public function jefe()
    {
        return $this->belongsTo(Empleado::class, 'idJefeInmediato');
    }
}
