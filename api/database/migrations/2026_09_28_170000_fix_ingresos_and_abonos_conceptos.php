<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Support\Facades\DB;

class FixIngresosAndAbonosConceptos extends Migration
{
    /**
     * Run the migrations.
     *
     * @return void
     */
    public function up()
    {
        // 1. En ingresos de estado de cuenta (referencia = 3) bajo rubro académico (idRubro = 1),
        // solo se permiten abonos: concepto = 'Abono', idTipo = 2.
        DB::table('ingresos')
            ->where('idRubro', 1)
            ->where('referencia', 3)
            ->where(function($q) {
                $q->where('concepto', '!=', 'Abono')->orWhere('idTipo', '!=', 2);
            })
            ->update([
                'concepto' => 'Abono',
                'idTipo' => 2
            ]);

        // Asegurar que los alumnoabonos correspondientes a pagos de estado de cuenta (referencia = 3) tengan concepto = 'Abono' e idConcepto = 1
        $ref3IngresoIds = DB::table('ingresos')->where('idRubro', 1)->where('referencia', 3)->pluck('id');
        if (!empty($ref3IngresoIds)) {
            DB::table('alumnoabonos')
                ->whereIn('idIngreso', $ref3IngresoIds)
                ->where(function($q) {
                    $q->where('concepto', '!=', 'Abono')->orWhere('idConcepto', '!=', 1);
                })
                ->update([
                    'concepto' => 'Abono',
                    'idConcepto' => 1
                ]);
        }

        // 2. Ingresos donde concepto es 'Abono' e idRubro = 1 pero idTipo quedó en 1: corregir idTipo = 2
        DB::table('ingresos')
            ->where('idRubro', 1)
            ->where('idTipo', 1)
            ->where('concepto', 'Abono')
            ->update([
                'idTipo' => 2
            ]);

        // 3. Ingresos con concepto vacío o nulo en idRubro = 1:
        DB::table('ingresos')
            ->where('idRubro', 1)
            ->where(function($q) {
                $q->whereNull('concepto')->orWhere('concepto', '');
            })
            ->where('idTipo', 2)
            ->update([
                'concepto' => 'Abono'
            ]);

        DB::table('ingresos')
            ->where('idRubro', 1)
            ->where(function($q) {
                $q->whereNull('concepto')->orWhere('concepto', '');
            })
            ->where('idTipo', 1)
            ->update([
                'concepto' => 'Abono',
                'idTipo' => 2,
                'observaciones' => 'Abono'
            ]);

        // 4. Alumnoabonos con concepto vacío o nulo:
        DB::table('alumnoabonos')
            ->where(function($q) {
                $q->whereNull('concepto')->orWhere('concepto', '');
            })
            ->where('idConcepto', 1)
            ->update([
                'concepto' => 'Abono'
            ]);

        DB::table('alumnoabonos')
            ->where(function($q) {
                $q->whereNull('concepto')->orWhere('concepto', '');
            })
            ->where('idConcepto', 2)
            ->update([
                'concepto' => 'Inscripcion'
            ]);

        // Cualquier alumnoabono restante con concepto vacío
        DB::table('alumnoabonos')
            ->where(function($q) {
                $q->whereNull('concepto')->orWhere('concepto', '');
            })
            ->update([
                'concepto' => 'Abono',
                'idConcepto' => 1
            ]);
    }

    /**
     * Reverse the migrations.
     *
     * @return void
     */
    public function down()
    {
    }
}
