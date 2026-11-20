<?php

namespace App;

use Illuminate\Database\Eloquent\Model;

class Reactivo extends Model
{
    protected $table = 'reactivos';

    protected $fillable = [
        'id', 'nombre', 'porcentaje', 'activo', 'eliminado'
    ];
}
