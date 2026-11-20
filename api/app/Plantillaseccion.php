<?php

namespace App;

use Illuminate\Database\Eloquent\Model;

class Plantillaseccion extends Model
{
    protected $table = 'plantilla_secciones';

    protected $fillable = [
        'idPlantilla', 'idSeccion', 'area', 'porcentajeArea', 'totalPreguntas', 'activo', 'eliminado', 'created_at', 'updated_at'
    ];

    public function seccion()
    {
        return $this->belongsTo('App\Seccione', 'idSeccion', 'id');
    }
}
