<?php

namespace App\Http\Controllers;
use App\Clases\Empleados;
use App\Empleado;
use App\Sucursale;
use App\Usuariosucursale;
use App\Usuario;
use App\Clases\Listas;
use Illuminate\Support\Facades\Hash;

use Laravel\Lumen\Routing\Controller as BaseController;
use Illuminate\Http\Request;



class EmpleadosController extends BaseController
{
    function mostrar(){
        try{
            $funciones = new Empleados();
            $respuesta['datos'] = $funciones->obtener();
            $respuesta['listas']['domicilio'] = Listas::listas(['estados', 'municipios']);
            $respuesta['listas']['empresa'] = Listas::listas(['sucursales', 'departamentos', 'puestos']);
            return response()->json($respuesta, 200);
        }catch(Exception $e){
            return response()->json("Error en el servidor", 400);
        }
    }

    function nuevo(Request $request){
        try{
            $personales = $request['personales'];
            $domicilio = $request['domicilio'];
            $fiscales = $request['fiscales'];
            $empresa = $request['empresa'];
            $imagenes = isset($request['imagenes']) ? $request['imagenes'] : null;

            $fechaIngreso = (isset($fiscales['fechaIngreso']) && strlen($fiscales['fechaIngreso']) > 0) ? $fiscales['fechaIngreso'] : null;
            $fechaAltaIMSS = null;
            if (isset($fiscales['fechaAltaImss']) && strlen($fiscales['fechaAltaImss']) > 0) {
                $fechaAltaIMSS = $fiscales['fechaAltaImss'];
            } else if (isset($fiscales['fechaAltaIMSS']) && strlen($fiscales['fechaAltaIMSS']) > 0) {
                $fechaAltaIMSS = $fiscales['fechaAltaIMSS'];
            }
            $fechaNacimiento = (isset($personales['fechaNacimiento']) && strlen($personales['fechaNacimiento']) > 0) ? $personales['fechaNacimiento'] : null;
            $hay = Empleado::all();
            
            $nss = (isset($fiscales['nss']) && strlen($fiscales['nss']) > 0) ? $fiscales['nss'] : (count($hay)+1);
            $rfc = (isset($fiscales['rfc']) && strlen($fiscales['rfc']) > 0) ? $fiscales['rfc'] : (count($hay)+1);
            $curp = (isset($fiscales['curp']) && strlen($fiscales['curp']) > 0) ? $fiscales['curp'] : (count($hay)+1);
            $bono = isset($empresa['bono']) ? $empresa['bono'] : (isset($empresa['bonoPuntualidad']) ? $empresa['bonoPuntualidad'] : 0);

            $empleado = Empleado::create([
                //Personales
                'nombre' => $personales['nombre'],
                'correo' => $personales['correo'],
                'telefono' => $personales['telefono'],
                'celular' => $personales['celular'],
                'estadoCivil' => $personales['estadoCivil'],
                'fechaNacimiento' => $fechaNacimiento,
                //Domicilio
                'calle' => $domicilio['calle'],
                'numeroInterior' => $domicilio['numeroInterior'],
                'numeroExterior' => $domicilio['numeroExterior'],
                'colonia' => $domicilio['colonia'],
                'idMunicipio' => $domicilio['idMunicipio'],
                'idEstado' => $domicilio['idEstado'],
                'codigoPostal' => $domicilio['codigoPostal'],
                //Fiscales
                'nss' => $nss,
                'rfc' => $rfc,
                'curp' => $curp,
                'fechaAltaIMSS' => $fechaAltaIMSS,
                'fechaIngreso' => $fechaIngreso,
                'cuentaBancaria' => $fiscales['cuentaBancaria'],
                //Empresa
                'sueldoBase' => $empresa['sueldoBase'],
                'sueldoFiscal' => $empresa['sueldoFiscal'],
                'idSucursal' => $empresa['idSucursal'],
                'idDepartamento' => $empresa['idDepartamento'],
                'idPuesto' => $empresa['idPuesto'],
                'bonoPuntualidad' => $bono,
                //Imagenes
                'actaNacimiento' => ($imagenes && isset($imagenes['actaNacimiento'])) ? $imagenes['actaNacimiento'] : NULL,
                'comprobanteDomicilio' => ($imagenes && isset($imagenes['comprobanteDomicilio'])) ? $imagenes['comprobanteDomicilio'] : NULL,
                'curpImagen' => ($imagenes && isset($imagenes['curpImagen'])) ? $imagenes['curpImagen'] : NULL,
                'ifef' => ($imagenes && isset($imagenes['ifef'])) ? $imagenes['ifef'] : NULL,
                'ifet' => ($imagenes && isset($imagenes['ifet'])) ? $imagenes['ifet'] : NULL,
                'rfcImagen' => ($imagenes && isset($imagenes['rfcImagen'])) ? $imagenes['rfcImagen'] : NULL,
                'carta1' => ($imagenes && isset($imagenes['carta1'])) ? $imagenes['carta1'] : NULL,
                'carta2' => ($imagenes && isset($imagenes['carta2'])) ? $imagenes['carta2'] : NULL,
                'nssImagen' => ($imagenes && isset($imagenes['nssImagen'])) ? $imagenes['nssImagen'] : NULL,
                'comprobanteEstudios' => ($imagenes && isset($imagenes['comprobanteEstudios'])) ? $imagenes['comprobanteEstudios'] : NULL,
                //Otros
                'activo' => 1,
                'eliminado' => 0
            ]);

            $funciones = new Empleados();
            $creado = $funciones->obtenerUno($empleado->id);

            return response()->json($creado ? $creado : $empleado, 200);
        }catch(\Throwable $e){
            return response()->json('Error en el servidor: ' . $e->getMessage(), 400);
        }
    }

    function modificar(Request $request){
        try{
            $personales = $request['personales'];
            $domicilio = $request['domicilio'];
            $fiscales = $request['fiscales'];
            $empresa = $request['empresa'];
            $imagenes = isset($request['imagenes']) ? $request['imagenes'] : null;

            $fechaIngreso = (isset($fiscales['fechaIngreso']) && strlen($fiscales['fechaIngreso']) > 0) ? $fiscales['fechaIngreso'] : null;
            $fechaAltaIMSS = null;
            if (isset($fiscales['fechaAltaImss']) && strlen($fiscales['fechaAltaImss']) > 0) {
                $fechaAltaIMSS = $fiscales['fechaAltaImss'];
            } else if (isset($fiscales['fechaAltaIMSS']) && strlen($fiscales['fechaAltaIMSS']) > 0) {
                $fechaAltaIMSS = $fiscales['fechaAltaIMSS'];
            }
            $fechaNacimiento = (isset($personales['fechaNacimiento']) && strlen($personales['fechaNacimiento']) > 0) ? $personales['fechaNacimiento'] : null;

            $id = isset($personales['id']) ? $personales['id'] : (isset($request['id']) ? $request['id'] : null);
            if (!$id) {
                return response()->json("ID de empleado no especificado", 400);
            }

            $empleado = Empleado::find($id);
            if (!$empleado) {
                return response()->json("Empleado no encontrado", 404);
            }

            //Personales
            $empleado->nombre = $personales['nombre'];
            $empleado->telefono = $personales['telefono'];
            $empleado->celular = $personales['celular'];
            $empleado->fechaNacimiento = $fechaNacimiento;
            $empleado->estadoCivil = $personales['estadoCivil'];
            $empleado->correo = $personales['correo'];

            //Domicilio
            $empleado->calle = $domicilio['calle'];
            $empleado->numeroInterior = $domicilio['numeroInterior'];
            $empleado->numeroExterior = $domicilio['numeroExterior'];
            $empleado->colonia = $domicilio['colonia'];
            $empleado->idMunicipio = $domicilio['idMunicipio'];
            $empleado->idEstado = $domicilio['idEstado'];
            $empleado->codigoPostal = $domicilio['codigoPostal'];
            
            //Fiscales
            $empleado->nss = $fiscales['nss'];
            $empleado->rfc = $fiscales['rfc'];
            $empleado->curp = $fiscales['curp'];
            $empleado->fechaAltaIMSS = $fechaAltaIMSS;
            $empleado->fechaIngreso = $fechaIngreso;
            $empleado->cuentaBancaria = $fiscales['cuentaBancaria'];

            //Empresa
            $empleado->idSucursal = $empresa['idSucursal'];
            $empleado->idDepartamento = $empresa['idDepartamento'];
            $empleado->idPuesto = $empresa['idPuesto'];
            $empleado->sueldoBase = $empresa['sueldoBase'];
            $empleado->sueldoFiscal = $empresa['sueldoFiscal'];
            $empleado->bonoPuntualidad = isset($empresa['bono']) ? $empresa['bono'] : (isset($empresa['bonoPuntualidad']) ? $empresa['bonoPuntualidad'] : 0);
            
            //Imagenes
            if ($imagenes && is_array($imagenes)) {
                if (array_key_exists('actaNacimiento', $imagenes)) $empleado->actaNacimiento = $imagenes['actaNacimiento'];
                if (array_key_exists('comprobanteDomicilio', $imagenes)) $empleado->comprobanteDomicilio = $imagenes['comprobanteDomicilio'];
                if (array_key_exists('curpImagen', $imagenes)) $empleado->curpImagen = $imagenes['curpImagen'];
                if (array_key_exists('ifef', $imagenes)) $empleado->ifef = $imagenes['ifef'];
                if (array_key_exists('ifet', $imagenes)) $empleado->ifet = $imagenes['ifet'];
                if (array_key_exists('rfcImagen', $imagenes)) $empleado->rfcImagen = $imagenes['rfcImagen'];
                if (array_key_exists('carta1', $imagenes)) $empleado->carta1 = $imagenes['carta1'];
                if (array_key_exists('carta2', $imagenes)) $empleado->carta2 = $imagenes['carta2'];
                if (array_key_exists('nssImagen', $imagenes)) $empleado->nssImagen = $imagenes['nssImagen'];
                if (array_key_exists('comprobanteEstudios', $imagenes)) $empleado->comprobanteEstudios = $imagenes['comprobanteEstudios'];
            }
            
            $empleado->save();

            $funciones = new Empleados();
            $actualizado = $funciones->obtenerUno($empleado->id);

            return response()->json($actualizado ? $actualizado : $empleado, 200);
        }catch(\Throwable $e){
            return response()->json("Error en el servidor: " . $e->getMessage(), 400);
        }
    }

    function activar(Request $request){
        try{
            $empleado = Empleado::find($request['id']);
            $empleado->fechaSalida = null;
            $empleado->activo = 1;
            $empleado->save();

            $funciones = new Empleados();
            $actualizado = $funciones->obtenerUno($empleado->id);

            return response()->json($actualizado ? $actualizado : $empleado, 200);
        }catch(\Throwable $e){
            return response()->json("Error en el servidor", 400);
        }
    }

    function desactivar(Request $request){
        try{
            $carbon = new \Carbon\Carbon();
            $date = $carbon->now();
            $empleado = Empleado::find($request['id']);
            $empleado->activo = 0;
            $empleado->fechaSalida = $date;
            $empleado->save();

            $funciones = new Empleados();
            $actualizado = $funciones->obtenerUno($empleado->id);

            return response()->json($actualizado ? $actualizado : $empleado, 200);
        }catch(\Throwable $e){
            return response()->json("Error en el servidor", 400);
        }
    }

    function eliminar(Request $request){
        try{
            $empleado = new Empleado();
            $empleado = Empleado::find($request['id']);
            $empleado->eliminado = 1;
            $empleado->save();

            return response()->json($empleado, 200);
        }catch(Exception $e){
            return response()->json("Error en el servidor", 400);
        }
    }

    function busquedaNombre(Request $request){
        try{
            $empleados = Empleado::join('departamentos', 'idDepartamento', '=', 'departamentos.id')->join('sucursales', 'idSucursal', '=', 'sucursales.id')->join('puestos', 'idPuesto', '=', 'puestos.id')->select('empleados.*', 'departamentos.nombre as departamento', 'sucursales.nombre as sucursal', 'puestos.nombre as puesto')->where('empleados.eliminado', '=', 0)->where('empleados.id', '<>', 1)->where('empleados.nombre', 'LIKE', '%'.$request['busqueda'].'%')->get();
            $json = array();
            foreach ($empleados as $empleado) {
                $usuario = Usuario::where('idEmpleado', '=', $empleado['id'])->get();
                $empleado['usuario'] = $usuario;
                $json[] = $empleado; 
            }
            return response()->json($json, 200);
        }catch(Exception $e){
            return response()->json("Error en el servidor", 400);
        }
    }

    function sucursales(Request $request){
        try {
            $sucursales = Sucursale::all();
            $usuario = Usuario::where('idEmpleado', '=', $request['id'])->where('eliminado', '=', 0)->first();
            if (!$usuario) {
                return response()->json([
                    'agregadas' => [],
                    'disponibles' => $sucursales
                ], 200);
            }
            $asignadas = Usuariosucursale::where('idUsuario', '=', $usuario->id)->get();
            $empleado = Empleado::find($request['id']);
            $disponibles = array();
            $agregadas = array();
            $respuesta = array();
            foreach ($sucursales as $sucursal) {
                $existe = false;
                foreach ($asignadas as $asignada) {
                    if(intval($sucursal->id) === intval($asignada->idSucursal)){
                        $agregadas[] = $sucursal;
                        $existe = true;
                    }
                }
                if(!$existe && (intval($sucursal->id) !== intval($empleado->idSucursal))){
                    $disponibles[] = $sucursal;
                }
            }
            $respuesta['agregadas'] = $agregadas;
            $respuesta['disponibles'] = $disponibles;
            return response()->json($respuesta, 200);
        } catch (Exception $e) {
            return response()->json('Error en el servidor', 400);
        }
    }

    function agregarSucursal(Request $request){
        try {
            $usuario = Usuario::where('idEmpleado', '=', $request['idUsuario'])->where('eliminado', '=', 0)->first();
            if (!$usuario) {
                return response()->json('El empleado no tiene un usuario configurado', 400);
            }
            $sucursal = Usuariosucursale::create([
                'activo' => 1,
                'eliminado' => 0,
                'idSucursal' => $request['idSucursal'],
                'idUsuario' => $usuario->id
            ]);

            return response()->json($sucursal, 200);
        } catch (Exception $e) {
            return response()->json('Error en el servidor', 400);
        }
    }

    function eliminarSucursal(Request $request){
        try {
            $usuario = Usuario::where('idEmpleado', '=', $request['idUsuario'])->where('eliminado', '=', 0)->first();
            if (!$usuario) {
                return response()->json('El empleado no tiene un usuario configurado', 400);
            }
            $sucursal = Usuariosucursale::where('idUsuario', '=', $usuario->id)->where('idSucursal', '=', $request['idSucursal'])->get()[0];
            $sucursal->delete();

            return response()->json('Sucursal eliminada correctamente', 200);
        } catch (Exception $e) {
            return response()->json('Error en el servidor', 400);
        }
    }

    function imagenes(Request $request){
        try {
            $empleado = Empleado::find($request['idEmpleado']);
            $empleado->actaNacimiento = $request['actaNacimiento'];
            $empleado->comprobanteDomicilio = $request['comprobanteDomicilio'];
            $empleado->curpImagen = $request['curpImagen'];
            $empleado->ifef = $request['ifef'];
            $empleado->ifet = $request['ifet'];
            $empleado->rfcImagen = $request['rfcImagen'];
            $empleado->carta1 = $request['carta1'];
            $empleado->carta2 = $request['carta2'];
            $empleado->nssImagen = $request['nssImagen'];
            $empleado->comprobanteEstudios = $request['comprobanteEstudios'];

            return response()->json($empleado, 200);
        } catch (Exception $e) {
            return response()->json('Error en el servidor', 400);
        }
    }
}
