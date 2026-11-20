<?php

namespace App;

use Illuminate\Database\Eloquent\Model;

class Reactivoseccione extends Model
{
    protected $table = 'reactivo_secciones';

    protected $fillable = [
        'id', 'idReactivo', 'idSeccion'
    ];
}
