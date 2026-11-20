<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Support\Facades\DB;

class SetEgresosFormaPagoEfectivoCuentaCero extends Migration
{
    /**
     * Run the migrations.
     *
     * @return void
     */
    public function up()
    {
        DB::table('egresos')
            ->where('idFormaPago', 1)
            ->where('idCuenta', '!=', 0)
            ->update(['idCuenta' => 0]);
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
