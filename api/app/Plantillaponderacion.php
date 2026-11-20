<?php

namespace App;

use Illuminate\Database\Eloquent\Model;

class Plantillaponderacion extends Model
{
    protected $table = 'plantillas_ponderacion';

    protected $fillable = [
        'nombre', 'descripcion', 'activo', 'eliminado', 'created_at', 'updated_at'
    ];

    public function secciones()
    {
        return $this->hasMany('App\Plantillaseccion', 'idPlantilla', 'id')
                    ->where('eliminado', '=', 0);
    }
}
