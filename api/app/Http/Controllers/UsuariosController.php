<?php

namespace App\Http\Controllers;

use App\Usuario;
use App\Empleado;
use App\Calendario;
use App\Usuariosucursale;
use App\Sucursale;
use App\Tipousuario;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\DB;
include "funciones/generales.php";

class UsuariosController extends Controller
{
    function nuevo(Request $request){
        try{
            $usernameDeseado = strtolower(trim($request['usuario']));

            $existe = Usuario::where('idEmpleado', '=', $request['idEmpleado'])->where('eliminado', '=', 0)->first();
            if($existe){
                // Si el usuario ya existe para este empleado: NO se permite modificar el string 'usuario'
                if ($request->has('password') && $request['password'] !== '0' && !empty($request['password'])) {
                    $existe->password = Hash::make($request['password']);
                }
                if ($request->has('idTipoUsuario')) {
                    $existe->idTipoUsuario = $request['idTipoUsuario'];
                }
                $existe->activo = 1;
                $existe->save();

                return response()->json($existe, 200);
            }else{
                // Verificar si el nombre de usuario deseado ya está en uso por OTRA persona
                $usuarioOcupado = Usuario::where('usuario', '=', $usernameDeseado)->where('eliminado', '=', 0)->first();
                if($usuarioOcupado){
                    return response()->json("⚠️ El nombre de usuario '{$usernameDeseado}' ya está ocupado. Por favor elige uno diferente.", 400);
                }

                $usuario = Usuario::create([
                    'usuario' => $usernameDeseado,
                    'password' => Hash::make($request['password']),
                    'idEmpleado' => $request['idEmpleado'],
                    'idTipoUsuario' => $request['idTipoUsuario'],
                    'activo' => 1,
                    'eliminado' => 0,
                    'foto' => ''
                ]);
                return response()->json($usuario, 200);
            }
        }catch(\Exception $e){
            return response()->json("Error en el servidor: " . $e->getMessage(), 400);
        }
    }

    function traer(Request $request){
        try{
            $usuario = Usuario::where('idEmpleado', '=', $request['id'])->where('eliminado', '=', 0)->get();
            if(count($usuario) > 0){
                return response()->json($usuario[0], 200);
            }else{
                return response()->json(array(), 200);
            }
        }catch(\Exception $e){
            return response()->json("Error en el servidor", 400);
        }
    }

    function modificar(Request $request){
        try{
            $usuario = Usuario::find($request['id']);
            if(!$usuario) {
                return response()->json("Usuario no encontrado", 404);
            }
            if(isset($request['password']) && $request['password'] !== '0' && !empty($request['password'])){
                $usuario->password = Hash::make($request['password']);
            }
            // El campo usuario no es modificable una vez asignado
            if (isset($request['idTipoUsuario'])) {
                $usuario->idTipoUsuario = $request['idTipoUsuario'];
            }
            $usuario->save();

            return response()->json($usuario, 200);
        }catch(\Exception $e){
            return response()->json("Error en el servidor", 400);
        }
    }

    function verificarDisponibilidad(Request $request){
        try {
            $username = strtolower(trim($request['usuario']));
            $idEmpleado = $request['idEmpleado'] ?? null;

            $query = Usuario::where('usuario', '=', $username)->where('eliminado', '=', 0);
            if ($idEmpleado) {
                $query->where('idEmpleado', '!=', $idEmpleado);
            }
            $existe = $query->first();

            if ($existe) {
                return response()->json([
                    'disponible' => false,
                    'mensaje' => "⚠️ El usuario '{$username}' ya está ocupado por otro empleado."
                ], 200);
            }

            return response()->json([
                'disponible' => true,
                'mensaje' => "✅ Usuario disponible."
            ], 200);
        } catch (\Exception $e) {
            return response()->json("Error al verificar usuario", 400);
        }
    }

    function sugerirUsuario(Request $request){
        try {
            $idEmpleado = $request['idEmpleado'];
            $empleado = Empleado::find($idEmpleado);

            if (!$empleado) {
                return response()->json("Empleado no encontrado", 404);
            }

            // Sanitizar nombre y apellido paterno
            $partesNombre = array_filter(explode(' ', trim($empleado->nombre)));
            $primerNombre = reset($partesNombre) ?: 'empleado';
            $primerApellido = count($partesNombre) > 1 ? end($partesNombre) : '';

            $baseUser = strtolower($this->limpiarTexto($primerNombre . ($primerApellido ? '.' . $primerApellido : '')));
            if (empty($baseUser)) {
                $baseUser = 'usuario' . $idEmpleado;
            }

            // Encontrar sugerencia única disponible
            $sugerencia = $baseUser;
            $contador = 1;
            while (Usuario::where('usuario', '=', $sugerencia)->where('eliminado', '=', 0)->where('idEmpleado', '!=', $idEmpleado)->exists()) {
                $sugerencia = $baseUser . $contador;
                $contador++;
            }

            return response()->json([
                'sugerencia' => $sugerencia,
                'base' => $baseUser
            ], 200);
        } catch (\Exception $e) {
            return response()->json("Error al generar sugerencia de usuario: " . $e->getMessage(), 400);
        }
    }

    private function limpiarTexto($texto) {
        $texto = strtolower($texto);
        $texto = str_replace(
            ['á', 'é', 'í', 'ó', 'ú', 'ñ', 'ä', 'ë', 'ï', 'ö', 'ü', ' '],
            ['a', 'e', 'i', 'o', 'u', 'n', 'a', 'e', 'i', 'o', 'u', ''],
            $texto
        );
        return preg_replace('/[^a-z0-9\.]/', '', $texto);
    }

    function eliminar(Request $request){
        try{
            $usuario = Usuario::find($request['id']);
            $usuario->eliminado = 1;
            $usuario->save();

            return response()->json($usuario, 200);
        }catch(Exception $e){
            return response()->json("Error en el servidor", 400);
        }
    }

    function informacion(Request $request){
        try{
            $usuario = Usuario::join('empleados', 'idEmpleado', '=', 'empleados.id')->
            join('sucursales', 'empleados.idSucursal', '=', 'sucursales.id')->
            select('empleados.nombre', 'empleados.idSucursal', 'usuarios.foto', 'usuarios.id', 'usuarios.idTipoUsuario', 'sucursales.nombre as sucursal')->
            where('usuarios.usuario', '=', $request['usuario'])->
            where('usuarios.activo', '=', 1)->
            where('usuarios.eliminado', '=', 0)->get();
            if(count($usuario) > 0){
                $user = $usuario[0];
                $user->calendario = calendarioActual();
                $respuesta['usuario'] = $user;

                $tipoUsuario = Tipousuario::find($user->idTipoUsuario);
                $isDirectivo = ($tipoUsuario && (strtolower($tipoUsuario->nombre) === 'directivo' || strtolower($tipoUsuario->nombre) === 'directivos'));

                if (intval($user->idTipoUsuario) === 1 || $isDirectivo) {
                    $sucursales = Sucursale::where('eliminado', '=', 0)->get();
                } else {
                    $sucursales = Usuariosucursale::join('sucursales', 'idSucursal', '=', 'sucursales.id')->
                    select('sucursales.*')->
                    where('usuariosucursales.idUsuario', '=', $user->id)->get();
                    $primarySucursal = Sucursale::find($user->idSucursal);
                    if ($primarySucursal) {
                        $exists = false;
                        foreach ($sucursales as $s) {
                            if (intval($s->id) === intval($primarySucursal->id)) {
                                $exists = true;
                                break;
                            }
                        }
                        if (!$exists) {
                            $sucursales[] = $primarySucursal;
                        }
                    }
                }
                $respuesta['sucursales'] = $sucursales;

                $respuesta['permisos'] = traerPermisosUsuario($user->idTipoUsuario);
                return response()->json($respuesta, 200);
            }

            
            return response()->json('Usuario inactivo o eliminado', 400);
        }catch(Exception $e){
            return response()->json("Error en el servidor", 400);
        }
    }

    function modificarImagen(Request $request){
        try {
            $usuario = Usuario::find($request['id']);
            $usuario->foto = $request['foto'];
            $usuario->save();

            return response()->json($usuario, 200);
        } catch (Exception $e) {
            return response()->json('Error en el servidor', 400);
        }
    }

    function datosUsuario(Request $request){
        try {
            $usuario = Usuario::find($request['id']);
            $consulta = Empleado::join('departamentos', 'idDepartamento', '=', 'departamentos.id')->
                                  join('puestos', 'idPuesto', '=', 'puestos.id')->
                                  join('sucursales', 'idSucursal', '=', 'sucursales.id')->
                                  select('departamentos.nombre as departamento', 'sucursales.nombre as sucursal', 'puestos.nombre as puesto', 'empleados.*')->
                                  where('empleados.id', '=', $usuario->idEmpleado)->get();
            $consulta[0]->usuario = $usuario->usuario;
            $consulta[0]->imagen = $usuario->foto;
            return response()->json($consulta[0], 200);
        } catch (Exception $e) {
            return response()->json('Error en el servidor', 400);
        }
    }

    function modificarPassword(Request $request){
        try {
            $usuario = Usuario::find($request['id']);
            $usuario->password = Hash::make($request['password']);
            $usuario->save();

            return response()->json($usuario, 200);
        } catch (Exception $e) {
            return response()->json('Error en el servidor', 400);
        }
    }
    
}