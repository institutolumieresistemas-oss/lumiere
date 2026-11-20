<?php

namespace App\Http\Controllers;

use Laravel\Lumen\Routing\Controller as BaseController;
use Illuminate\Http\Request;
use App\Clases\BanorteVce;
use App\Banortepago;
use App\Alumnoabono;

class BanortePagosController extends BaseController
{
    private $banorte;

    public function __construct()
    {
        $this->banorte = new BanorteVce();
    }

    /**
     * Inicia una transacción de cobro con Banorte VCE y retorna la cadena cifrada para el lightbox
     */
    public function iniciar(Request $request)
    {
        try {
            $monto = (float)($request->input('monto', 0));
            if ($monto < 1.00) {
                return response()->json(['error' => 'El monto mínimo a cobrar es $1.00 MXN'], 400);
            }

            // Datos del cliente / pagador
            $datos = [
                'monto' => $monto,
                'nombreCliente' => $request->input('cliente_nombre') ?? $request->input('nombre', ''),
                'apellidosCliente' => $request->input('cliente_apellidos') ?? $request->input('apellidos', ''),
                'correo' => $request->input('cliente_correo') ?? $request->input('correo', ''),
                'telefono' => $request->input('cliente_telefono') ?? $request->input('telefono', ''),
                'calle' => $request->input('calle', ''),
                'numeroExterior' => $request->input('numeroExterior', ''),
                'colonia' => $request->input('colonia', ''),
                'municipio' => $request->input('municipio', ''),
                'ciudad' => $request->input('ciudad', ''),
                'estado' => $request->input('estado', ''),
                'codigoPostal' => $request->input('codigoPostal', ''),
                'ip' => $request->ip(),
                'mesesSinIntereses' => $request->input('mesesSinIntereses', null),
                'mode' => $request->input('mode', null), // Permite forzar AUT / PRD en pruebas
            ];

            // Generar cifrado requerido por Banorte
            $cifrado = $this->banorte->generarCadenaCifrada($datos);

            // Imprimir en terminal ("pantalla negra") el JSON enviado
            error_log("\n================= [JSON ENVIADO A BANORTE] =================");
            error_log(json_encode($cifrado['payloadJson'], JSON_PRETTY_PRINT | JSON_UNESCAPED_SLASHES | JSON_UNESCAPED_UNICODE));
            error_log("============================================================\n");

            // Registrar en base de datos en estado PENDIENTE
            $pago = Banortepago::create([
                'numero_control' => $cifrado['controlNumber'],
                'monto' => $cifrado['monto'],
                'concepto' => $request->input('concepto', 'Pago en línea'),
                'tipo_origen' => $request->input('tipo_origen', null),
                'id_origen' => $request->input('id_origen', null),
                'cliente_nombre' => trim(($datos['nombreCliente'] . ' ' . $datos['apellidosCliente'])) ?: null,
                'cliente_correo' => $datos['correo'] ?: null,
                'cliente_telefono' => $datos['telefono'] ?: null,
                'estatus' => 'PENDIENTE',
                'passphrase' => $cifrado['passphrase'],
                'vi_hex' => $cifrado['viHex'],
                'salt_hex' => $cifrado['saltHex'],
                'activo' => 1,
                'eliminado' => 0
            ]);

            return response()->json([
                'status' => 'success',
                'idPago' => $pago->id,
                'numeroControl' => $cifrado['controlNumber'],
                'cadenaFinal' => $cifrado['cadenaFinal'],
                'modo' => $cifrado['modo'],
                'monto' => $cifrado['monto']
            ], 200);

        } catch (\Exception $e) {
            return response()->json([
                'status' => 'error',
                'mensaje' => 'Error al inicializar pago con Banorte: ' . $e->getMessage(),
                'codigoError' => 'ERR_INICIALIZACION'
            ], 400);
        }
    }

    /**
     * Confirma y descifra la respuesta enviada por la Ventana de Comercio Electrónico
     */
    public function confirmar(Request $request)
    {
        try {
            $numeroControl = $request->input('numeroControl') ?? $request->input('controlNumber');
            $cypherData = $request->input('data');

            if (!$numeroControl || !$cypherData) {
                return response()->json(['error' => 'Faltan parámetros requeridos (numeroControl o data)'], 400);
            }

            $pago = Banortepago::where('numero_control', $numeroControl)
                ->where('eliminado', 0)
                ->first();

            if (!$pago) {
                return response()->json(['error' => 'No se encontró la transacción de pago para el número de control: ' . $numeroControl], 404);
            }

            // Descifrar respuesta con las llaves guardadas en la transacción
            $datosDescifrados = $this->banorte->descifrarRespuesta(
                $cypherData,
                $pago->passphrase,
                $pago->vi_hex,
                $pago->salt_hex
            );

            // Imprimir en terminal ("pantalla negra") el JSON de respuesta descifrado
            error_log("\n================ [JSON RESPUESTA DE BANORTE] ================");
            error_log(json_encode($datosDescifrados, JSON_PRETTY_PRINT | JSON_UNESCAPED_SLASHES | JSON_UNESCAPED_UNICODE));
            error_log("============================================================\n");

            $resultado = $datosDescifrados['resultadoPayw'] ?? 'E';
            $pago->payworks_referencia = $datosDescifrados['referencia'] ?? null;
            $pago->payworks_codigo_aut = $datosDescifrados['codigoAut'] ?? null;
            $pago->payworks_resultado = $resultado;
            $pago->payworks_texto = $datosDescifrados['texto'] ?? null;
            $pago->payworks_datos = $datosDescifrados;

            if ($resultado === 'A') {
                $pago->estatus = 'APROBADO';
                $pago->save();

                // Si viene vinculado a una ficha de alumno, podemos registrar automáticamente el abono
                if ($pago->tipo_origen === 'ficha' && !empty($pago->id_origen)) {
                    try {
                        Alumnoabono::create([
                            'idFicha' => $pago->id_origen,
                            'monto' => $pago->monto,
                            'idMetodoPago' => 1, // Tarjeta / Pasarela
                            'idFormaPago' => 1,
                            'idUsuario' => 1,
                            'idConcepto' => 0,
                            'concepto' => 'Pago en línea Banorte Aut: ' . ($pago->payworks_codigo_aut ?? 'N/A'),
                            'activo' => 1,
                            'eliminado' => 0
                        ]);
                    } catch (\Exception $exAbono) {
                        // Log pero no revertir la aprobación del pago bancario
                        \Illuminate\Support\Facades\Log::warning("No se pudo crear Alumnoabono automático: " . $exAbono->getMessage());
                    }
                }


                return response()->json([
                    'status' => 'aprobado',
                    'mensaje' => 'Pago aprobado exitosamente',
                    'numeroControl' => $pago->numero_control,
                    'codigoAutorizacion' => $pago->payworks_codigo_aut,
                    'referencia' => $pago->payworks_referencia,
                    'monto' => $pago->monto,
                    'texto' => $pago->payworks_texto
                ], 200);

            } else {
                $pago->estatus = ($resultado === 'D') ? 'DECLINADO' : 'RECHAZADO';
                $pago->save();

                $codigoError = $datosDescifrados['id_error']
                    ?? $datosDescifrados['codigoError']
                    ?? $datosDescifrados['errorCode']
                    ?? $datosDescifrados['respCode']
                    ?? $resultado;

                return response()->json([
                    'status' => 'declinado',
                    'mensaje' => 'La transacción no fue autorizada: ' . ($pago->payworks_texto ?? 'Declinada por el banco'),
                    'resultadoPayw' => $resultado,
                    'codigoError' => (string)$codigoError,
                    'texto' => $pago->payworks_texto,
                    'numeroControl' => $pago->numero_control,
                    'referencia' => $pago->payworks_referencia,
                    'datos' => $datosDescifrados
                ], 400);
            }

        } catch (\Exception $e) {
            return response()->json([
                'status' => 'error',
                'mensaje' => 'Error al confirmar la transacción de Banorte: ' . $e->getMessage(),
                'codigoError' => 'ERR_CONFIRMACION',
                'numeroControl' => $request->input('numeroControl') ?? $request->input('controlNumber')
            ], 400);
        }
    }

    /**
     * Consulta el estado actual de un pago registrado
     */
    public function consultar(Request $request)
    {
        try {
            $numeroControl = $request->input('numeroControl');
            $id = $request->input('id');

            $query = Banortepago::where('eliminado', 0);
            if ($numeroControl) {
                $query->where('numero_control', $numeroControl);
            } elseif ($id) {
                $query->where('id', $id);
            } else {
                return response()->json(['error' => 'Se requiere id o numeroControl'], 400);
            }

            $pago = $query->first();
            if (!$pago) {
                return response()->json(['error' => 'Transacción no encontrada'], 404);
            }

            return response()->json([
                'id' => $pago->id,
                'numeroControl' => $pago->numero_control,
                'monto' => $pago->monto,
                'concepto' => $pago->concepto,
                'estatus' => $pago->estatus,
                'codigoAutorizacion' => $pago->payworks_codigo_aut,
                'referencia' => $pago->payworks_referencia,
                'texto' => $pago->payworks_texto,
                'fecha' => $pago->created_at ? $pago->created_at->format('Y-m-d H:i:s') : null
            ], 200);

        } catch (\Exception $e) {
            return response()->json(['error' => 'Error al consultar pago: ' . $e->getMessage()], 400);
        }
    }
}
