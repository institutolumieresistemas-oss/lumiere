<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

class CreateBanortepagosTable extends Migration
{
    /**
     * Run the migrations.
     *
     * @return void
     */
    public function up()
    {
        if (!Schema::hasTable('banortepagos')) {
            Schema::create('banortepagos', function (Blueprint $table) {
                $table->id();
                $table->string('numero_control', 50)->unique();
                $table->decimal('monto', 10, 2);
                $table->string('concepto', 150)->nullable();
                $table->string('tipo_origen', 50)->nullable();
                $table->unsignedBigInteger('id_origen')->nullable();
                $table->string('cliente_nombre', 100)->nullable();
                $table->string('cliente_correo', 100)->nullable();
                $table->string('cliente_telefono', 20)->nullable();
                $table->string('estatus', 30)->default('PENDIENTE');
                $table->string('passphrase', 50)->nullable();
                $table->string('vi_hex', 64)->nullable();
                $table->string('salt_hex', 64)->nullable();
                $table->string('payworks_referencia', 50)->nullable();
                $table->string('payworks_codigo_aut', 50)->nullable();
                $table->string('payworks_resultado', 10)->nullable();
                $table->string('payworks_texto', 255)->nullable();
                $table->text('payworks_datos')->nullable();
                $table->tinyInteger('activo')->default(1);
                $table->tinyInteger('eliminado')->default(0);
                $table->timestamps();
            });
        }
    }

    /**
     * Reverse the migrations.
     *
     * @return void
     */
    public function down()
    {
        Schema::dropIfExists('banortepagos');
    }
}
