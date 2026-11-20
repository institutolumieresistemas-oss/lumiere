<?php

namespace App;

use Illuminate\Database\Eloquent\Model;

class Preinscripcione extends Model
{
    protected $table = 'preinscripciones';

    /**
     * The attributes that are mass assignable.
     *
     * @var array
     */
    protected $fillable = [
        'id', 'datos', 'activo', 'eliminado', 'created_at', 'updated_at'
    ];

    /**
     * The attributes that should be cast to native types.
     *
     * @var array
     */
    protected $casts = [
        'datos' => 'array',
        'activo' => 'boolean',
        'eliminado' => 'boolean'
    ];
}
