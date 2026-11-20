<?php

namespace App\Http\Controllers;
use App\Formularioclasegrati;
use App\Formularioinformacionpersonalizada;
use App\Formulariocupondescuento;

use Laravel\Lumen\Routing\Controller as BaseController;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
include "funciones/generales.php";

class FormulariosController extends BaseController
{
    function guardarClaseGratis(Request $request){
      try {
        $existe = Formularioclasegrati::where('celular', '=', $request['celular'])->get();
        if(count($existe) > 0){
          return response()->json('Ya has hecho un resgistro anteriormente', 400);
        }
        $registro = Formularioclasegrati::create([
          'nombre' => $request['nombre'],
          'celular' => $request['celular'],
          'idCarrera' => $request['idCarrera'],
          'promedio' => $request['promedio'],
          'idSucursal' => $request['idSucursal'],
          'activo' => 1,
          'eliminado' => 0
        ]);
        return response()->json($registro, 200);
      } catch (Exception $e) {
        return response()->json('Error en el servidor', 400);
      }
    }

    function guardarInformacionPersonalizada(Request $request){
      try {
        $existe = Formularioinformacionpersonalizada::where('celular', '=', $request['celular'])->get();
        if(count($existe) > 0){
          return response()->json($existe[0], 200);
        }else{
          $registro = Formularioinformacionpersonalizada::create([
            'nombre' => $request['nombre'],
            'celular' => $request['celular'],
            'activo' => 1,
            'eliminado' => 0
          ]);

          return response()->json($registro, 200);
        }
      } catch (Exception $e) {
        return response()->json('Error en el servidor', 400);
      }
    }

    function guardarCuponDescuento(Request $request){
      try {
        $existe = Formulariocupondescuento::where('celular', '=', $request['celular'])->get();
        if(count($existe)){
          return response()->json($existe[0], 200);
        }else{
          $registro = Formulariocupondescuento::create([
            'nombre' => $request['nombre'],
            'celular' => $request['celular'],
            'descuento' => $request['descuento'],
            'activo' => 1,
            'eliminado' => 0
          ]);

          return response()->json($registro, 200);
        }
      } catch (Exception $e) {
        return response()->json('Error en el servidor', 400);
      }
    }

    function kommoLead(Request $request){
        try {
            $kommoUrl   = $request->input('kommo_url');  // ej: https://lumierecurso.kommo.com/api/v4/leads/complex
            $token      = $request->input('token');        // Bearer token de Kommo
            $nombre     = $request->input('nombre', 'Nuevo Lead');
            $correo     = $request->input('correo', '');
            $telefono   = $request->input('telefono', '');
            $celular    = $request->input('celular', '');
            $pipelineId = $request->input('pipeline_id', '');
            $statusId   = $request->input('status_id', '');

            if (!$kommoUrl || !$token) {
                return response()->json(['error' => 'Faltan parámetros: kommo_url y token son requeridos'], 400);
            }

            // Normalizar la URL para asegurar que use el endpoint complex si se apunta a /leads
            if (preg_match('/\/api\/v4\/leads\/?$/', trim($kommoUrl))) {
                $kommoUrl = rtrim($kommoUrl, '/') . '/complex';
            }

            // Construir campos personalizados del contacto
            $customFields = [];

            if (!empty($correo)) {
                $customFields[] = [
                    'field_code' => 'EMAIL',
                    'values'     => [['value' => $correo, 'enum_code' => 'WORK']]
                ];
            }

            $phoneValue = !empty($telefono) ? $telefono : $celular;
            if (!empty($phoneValue)) {
                $customFields[] = [
                    'field_code' => 'PHONE',
                    'values'     => [['value' => $phoneValue, 'enum_code' => 'WORK']]
                ];
            }

            // Payload en formato requerido por Kommo /api/v4/leads/complex
            $leadData = [
                'name' => $nombre,
                '_embedded' => [
                    'contacts' => [
                        [
                            'first_name'           => $nombre,
                            'custom_fields_values' => $customFields
                        ]
                    ]
                ]
            ];

            // Si se proporciona pipeline_id, añadirlo como entero
            if (!empty($pipelineId)) {
                $leadData['pipeline_id'] = (int)$pipelineId;
            }

            // Si se proporciona status_id, añadirlo como entero
            if (!empty($statusId)) {
                $leadData['status_id'] = (int)$statusId;
            }

            $payload = json_encode([$leadData]);

            // Enviar a Kommo server-to-server con cURL (sin restricciones CORS)
            $ch = curl_init();
            curl_setopt_array($ch, [
                CURLOPT_URL            => $kommoUrl,
                CURLOPT_RETURNTRANSFER => true,
                CURLOPT_POST           => true,
                CURLOPT_POSTFIELDS     => $payload,
                CURLOPT_HTTPHEADER     => [
                    'Content-Type: application/json',
                    'Authorization: Bearer ' . $token
                ],
                CURLOPT_SSL_VERIFYPEER => false
            ]);

            $respuesta  = curl_exec($ch);
            $httpStatus = curl_getinfo($ch, CURLINFO_HTTP_CODE);
            curl_close($ch);

            $data = json_decode($respuesta, true);

            if ($httpStatus >= 200 && $httpStatus < 300) {
                return response()->json(['ok' => true, 'data' => $data], 200);
            } else {
                return response()->json(['ok' => false, 'error' => $data, 'status' => $httpStatus], 400);
            }

        } catch (Exception $e) {
            return response()->json(['error' => 'Error en el servidor: ' . $e->getMessage()], 500);
        }
    }
}