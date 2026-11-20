<?php

namespace App;

use Illuminate\Database\Eloquent\Model;

class Banortepago extends Model
{
    protected $table = 'banortepagos';

    protected $fillable = [
        'id',
        'numero_control',
        'monto',
        'concepto',
        'tipo_origen',
        'id_origen',
        'cliente_nombre',
        'cliente_correo',
        'cliente_telefono',
        'estatus',
        'passphrase',
        'vi_hex',
        'salt_hex',
        'payworks_referencia',
        'payworks_codigo_aut',
        'payworks_resultado',
        'payworks_texto',
        'payworks_datos',
        'activo',
        'eliminado',
        'created_at',
        'updated_at'
    ];

    protected $casts = [
        'monto' => 'float',
        'payworks_datos' => 'array',
    ];
}
