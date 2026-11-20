<?php

namespace App\Http\Controllers;

use App\Examene;
use App\Ficha;
use App\Grupo;
use App\Altacurso;
use App\Seccione;
use App\Calendario;
use App\Nivele;
use App\Subnivele;
use App\Curso;
use App\Categoria;
use App\Modalidade;
use App\Turno;
use App\Horario;
use App\Alumno;
use App\Examenpermiso;
use App\Examenporcentaje;
use App\Calificacione;
use App\Pregunta;
use App\Seccionesporcentaje;
use App\Datosescolare;
use App\Aspiracione;
use App\Carrera;
use App\Clases\Listas;

use Laravel\Lumen\Routing\Controller as BaseController;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
require_once "funciones/funcionesBaseDatos.php";

class CalificadorController extends BaseController
{
    private function obtenerPuntajePAA($nombreArea, $aciertos) {
        $aciertos = intval($aciertos);
        if ($aciertos <= 0) return 200;

        $tablaLectura = [
            70=>800, 69=>790, 68=>780, 67=>771, 66=>761, 65=>752, 64=>742, 63=>733, 62=>724, 61=>715,
            60=>707, 59=>698, 58=>689, 57=>681, 56=>672, 55=>663, 54=>655, 53=>647, 52=>638, 51=>630,
            50=>621, 49=>613, 48=>605, 47=>596, 46=>588, 45=>580, 44=>571, 43=>563, 42=>554, 41=>546,
            40=>538, 39=>529, 38=>521, 37=>512, 36=>504, 35=>495, 34=>487, 33=>479, 32=>470, 31=>462,
            30=>453, 29=>445, 28=>436, 27=>428, 26=>419, 25=>411, 24=>402, 23=>394, 22=>385, 21=>377,
            20=>363, 19=>360, 18=>352, 17=>343, 16=>335, 15=>326, 14=>318, 13=>310, 12=>301, 11=>293,
            10=>284, 9=>276, 8=>268, 7=>259, 6=>251, 5=>242, 4=>234, 3=>225, 2=>217, 1=>208
        ];

        $tablaMatematicas = [
            55=>800, 54=>795, 53=>787, 52=>778, 51=>769, 50=>759, 49=>749, 48=>740, 47=>730, 46=>721,
            45=>712, 44=>704, 43=>696, 42=>688, 41=>680, 40=>673, 39=>665, 38=>658, 37=>650, 36=>642,
            35=>634, 34=>626, 33=>617, 32=>608, 31=>598, 30=>588, 29=>577, 28=>566, 27=>555, 26=>543,
            25=>530, 24=>518, 23=>504, 22=>491, 21=>477, 20=>463, 19=>449, 18=>434, 17=>419, 16=>405,
            15=>390, 14=>375, 13=>360, 12=>342, 11=>330, 10=>315, 9=>300, 8=>285, 7=>271, 6=>258,
            5=>245, 4=>232, 3=>222, 2=>212, 1=>205
        ];

        $isMate = (stripos($nombreArea, 'mate') !== false || stripos($nombreArea, 'cuant') !== false);
        $tabla = $isMate ? $tablaMatematicas : $tablaLectura;
        $maxAciertos = $isMate ? 55 : 70;

        if ($aciertos >= $maxAciertos) return 800;

        return isset($tabla[$aciertos]) ? $tabla[$aciertos] : 200;
    }

    function selects(){
        try {
            $respuestas = Listas::listas(['actuales', 'niveles', 'subniveles', 'cursos', 'categorias', 'modalidades', 'turnos']);

            return response()->json($respuesta, 200);
        } catch (Exception $e) {
            return response()->json('Error en el servidor', 400);
        }
    }

    function mostrar(Request $request){
        try {
            $respuesta = Listas::listas(['actuales', 'niveles', 'subniveles', 'cursos', 'categorias', 'modalidades', 'turnos', 'horarios']);
            return response()->json($respuesta, 200);
        } catch (Exception $e) {
            return response()->json('Error en el servidor', 400);
        }
    }

    function horarios(Request $request) {
        try {
            $horarios = Horario::where('eliminado', '=', 0)->
                                 where('idTurno', '=', $request['idTurno'])->get();
            $respuesta = array();
            foreach ($horarios as $horario) {
                $horario->nombre = $horario->inicio.'-'.$horario->fin;
                $respuesta[] = $horario;
            }
            return response()->json($respuesta, 200);
        } catch (Exception $e) {
            return response()->json('Error en el servidor', 400);
        }
    }

    function grupos(Request $request) {
        try {
            $calendario = $request['idCalendario'];
            $nivel = $request['idNivel'];
            $subnivel = $request['idSubnivel'];
            $curso = $request['idCurso'];
            $modalidad = $request['idModalidad'];
            $categoria = $request['idCategoria'];
            $turno = $request['idTurno'];
            $horario = $request['idHorario'];
            $consulta = "SELECT g.*, ac.idCalendario, ac.idNivel, ac.idSubnivel, ac.idModalidad, ac.idCategoria, ac.idCurso, ac.inicio, ac.fin, ac.limitePago, ac.precio, 
                   c.nombre as calendario, t.nombre as turno, n.nombre as nivel, s.nombre as subnivel, m.nombre as modalidad, cat.nombre as categoria, 
                   CONCAT(h.inicio,'-',h.fin) as horario, cr.nombre as curso, cr.icono as icono, se.nombre as sede,
                   f_summary.totalAlumnos
            FROM grupos g
            JOIN (
                SELECT idGrupo, COUNT(*) as totalAlumnos
                FROM fichas
                WHERE eliminado = 0 AND estatus = 1
                GROUP BY idGrupo
            ) f_summary ON f_summary.idGrupo = g.id
            JOIN altacursos ac ON g.idAltaCurso = ac.id
            JOIN calendarios c ON ac.idCalendario = c.id
            JOIN turnos t ON g.idTurno = t.id
            JOIN niveles n ON ac.idNivel = n.id
            JOIN subniveles s ON ac.idSubnivel = s.id
            JOIN modalidades m ON ac.idModalidad = m.id
            JOIN categorias cat ON ac.idCategoria = cat.id
            JOIN cursos cr ON ac.idCurso = cr.id
            JOIN horarios h ON g.idHorario = h.id
            JOIN sedes se ON ac.idSede = se.id
            WHERE g.eliminado = 0 ";

            $consulta.= (intval($calendario) > 0) ? ' AND c.id ='. $calendario. ' ' :  '';
            $consulta.= (intval($nivel) > 0) ? ' AND n.id ='. $nivel. ' ' :  '';
            $consulta.= (intval($subnivel) > 0) ? ' AND s.id ='. $subnivel. ' ' :  '';
            $consulta.= (intval($curso) > 0) ? ' AND cr.id ='. $curso. ' ' :  '';
            $consulta.= (intval($modalidad) > 0) ? ' AND m.id ='. $modalidad. ' ' :  '';
            $consulta.= (intval($categoria) > 0) ? ' AND cat.id ='. $categoria. ' ' :  '';
            $consulta.= (intval($turno) > 0) ? ' AND t.id ='. $turno. ' ' :  '';
            $consulta.= (intval($horario) > 0) ? ' AND h.id ='. $horario. ' ' :  '';
            $consulta.= " ORDER BY g.id DESC";
            $registros = DB::select($consulta, array());
            return response()->json($registros, 200);
        } catch (\Throwable $e) {
            return response()->json('Error en el servidor: ' . $e->getMessage(), 400);
        }
    }

    function alumnos(Request $request){
        try {
            $fichasQuery = Ficha::where('idGrupo', '=', $request['idGrupo'])->
                             where('eliminado', '=', 0)->
                             where('estatus', '=', 1);
            
            if (!empty($request['idSucursal']) && intval($request['idSucursal']) > 0) {
                $fichasSuc = (clone $fichasQuery)->where('idSucursalImparticion', '=', $request['idSucursal'])->get();
                $fichas = count($fichasSuc) > 0 ? $fichasSuc : $fichasQuery->get();
            } else {
                $fichas = $fichasQuery->get();
            }
            $respuesta = array();
            foreach ($fichas as $ficha) {
                $alumno = Alumno::find($ficha->idAlumno);
                if ($alumno) {
                    $ficha->alumno = trim($alumno->nombre . ' ' . $alumno->apellidoPaterno . ' ' . $alumno->apellidoMaterno);
                    $respuesta[] = $ficha;
                }
            }
            return response()->json($respuesta, 200);
        } catch (\Throwable $e) {
            return response()->json('Error en el servidor: ' . $e->getMessage(), 400);
        }
    }

    function traerExamenes(Request $request){
        try {
            $examenes = traerExamenesGrupo($request['idGrupo']);
            return response()->json($examenes, 200);
        } catch (Exception $e) {
            return response()->json('Error en el servidor', 400);
        }
    }

    function traerSecciones(Request $request){
        try {
            $idFicha = $request['idFicha'];
            $idExamen = $request['idExamen'];

            $ficha = Ficha::find($idFicha);
            $alumno = Alumno::find($ficha->idAlumno);
            if(intval($ficha->idNivel) !== 2){
                $escolares = Datosescolare::where('idAlumno', '=', $alumno->id)->first();
                $aspiracion = Aspiracione::where('idFicha', '=', $ficha->id)->first();
                $carrera = ($aspiracion && $aspiracion->idCarrera) ? Carrera::find($aspiracion->idCarrera) : null;
            }else{
                $escolares = null;
                $aspiracion = null;
                $carrera = null;
            }
            
            $examen = Examene::find($idExamen);

            // 1. Fetch reactivos associated with the sections of this exam
            $reactivos = DB::select("
                SELECT DISTINCT r.* 
                FROM reactivos r
                JOIN reactivo_secciones rs ON rs.idReactivo = r.id
                JOIN secciones s ON rs.idSeccion = s.id
                WHERE s.idExamen = ? AND r.eliminado = 0 AND s.eliminado = 0
            ", [$idExamen]);

            $respuesta = array();
            $porcentajeFinal = 0;

            if (count($reactivos) > 0) {
                foreach ($reactivos as $reactivo) {
                    $seccionesReactivo = DB::select("
                        SELECT s.nombre as seccion, s.id as idSeccion, s.totalPreguntas
                        FROM secciones s
                        JOIN reactivo_secciones rs ON rs.idSeccion = s.id
                        WHERE rs.idReactivo = ? AND s.idExamen = ? AND s.eliminado = 0
                    ", [$reactivo->id, $idExamen]);

                    $seccionesPorcentaje = array();
                    $aciertosTotales = 0;
                    $preguntasTotales = 0;
                    $total = count($seccionesReactivo);

                    foreach ($seccionesReactivo as $seccion) {
                        $countPreg = intval($seccion->totalPreguntas) > 0 ? intval($seccion->totalPreguntas) : count(Pregunta::where('idSeccion', '=', $seccion->idSeccion)->where('eliminado', '=', 0)->get());

                        $resultado = Calificacione::where('idFicha', '=', $idFicha)
                                                    ->where('idExamen', '=', $idExamen)
                                                    ->where('idSeccion', '=', $seccion->idSeccion)
                                                    ->first();
                        if($resultado){
                            $secData = new \stdClass();
                            $secData->seccion = $seccion->seccion;
                            $secData->idSeccion = $seccion->idSeccion;
                            $secData->aciertos = $resultado->aciertos;
                            $secData->errores = $resultado->errores;
                            $secData->ausentes = $resultado->ausentes;
                            $secData->totalPreguntas = $countPreg;
                            $seccionesPorcentaje[] = $secData;

                            $aciertosTotales += intval($resultado->aciertos);
                            $preguntasTotales += $countPreg;
                            $total--;
                        }else{
                            $sectionData = array();
                            $sectionData['seccion'] = $seccion->seccion;
                            $sectionData['aciertos'] = '';
                            $sectionData['errores'] = '';
                            $sectionData['ausentes'] = '';
                            $sectionData['idSeccion'] = $seccion->idSeccion;
                            $sectionData['totalPreguntas'] = $countPreg;
                            $seccionesPorcentaje[] = (object)$sectionData;
                            
                            $preguntasTotales += $countPreg;
                        }
                    }

                    $reactivo->secciones = $seccionesPorcentaje;

                    if($total === 0 && $preguntasTotales > 0){
                        if (intval($examen->forma) === 1) {
                            $puntajePAA = $this->obtenerPuntajePAA($reactivo->nombre, $aciertosTotales);
                            $reactivo->promedio = $puntajePAA;
                            $reactivo->totalPromedio = ($puntajePAA - 200) / 12;
                        } else {
                            $reactivo->promedio = ($aciertosTotales / $preguntasTotales) * 100;
                            $reactivo->totalPromedio = ($aciertosTotales / $preguntasTotales) * floatval($reactivo->porcentaje);
                        }
                        $porcentajeFinal += floatval($reactivo->porcentaje);
                    } else {
                        $reactivo->promedio = 0;
                        $reactivo->totalPromedio = 0;
                    }
                    $respuesta[] = $reactivo;
                }
            } else {
                // FALLBACK 1: Examenporcentaje & Seccionesporcentaje
                $porcentajes = Examenporcentaje::where('idExamen', '=', $idExamen)->where('eliminado', '=', 0)->get();

                if (count($porcentajes) > 0) {
                    foreach ($porcentajes as $porcentaje) {
                        $seccionesPorcentaje = array();
                        $secciones = Seccionesporcentaje::where('idPorcentaje', '=', $porcentaje->id)->where('eliminado', '=', 0)->get();
                        $total = count($secciones);
                        $aciertosTotales = 0;
                        $preguntasTotales = 0;

                        foreach ($secciones as $seccRel) {
                            $resSec = Seccione::find($seccRel->idSeccion);
                            if (!$resSec || $resSec->eliminado) continue;

                            $countPreg = intval($resSec->totalPreguntas) > 0 ? intval($resSec->totalPreguntas) : count(Pregunta::where('idSeccion', '=', $resSec->id)->where('eliminado', '=', 0)->get());

                            $resultado = Calificacione::where('idFicha', '=', $idFicha)
                                                        ->where('idExamen', '=', $idExamen)
                                                        ->where('idSeccion', '=', $resSec->id)
                                                        ->first();
                            if ($resultado) {
                                $secData = new \stdClass();
                                $secData->seccion = $resSec->nombre;
                                $secData->idSeccion = $resSec->id;
                                $secData->aciertos = $resultado->aciertos;
                                $secData->errores = $resultado->errores;
                                $secData->ausentes = $resultado->ausentes;
                                $secData->totalPreguntas = $countPreg;
                                $seccionesPorcentaje[] = $secData;

                                $aciertosTotales += intval($resultado->aciertos);
                                $preguntasTotales += $countPreg;
                                $total--;
                            } else {
                                $sectionData = array();
                                $sectionData['seccion'] = $resSec->nombre;
                                $sectionData['aciertos'] = '';
                                $sectionData['errores'] = '';
                                $sectionData['ausentes'] = '';
                                $sectionData['idSeccion'] = $resSec->id;
                                $sectionData['totalPreguntas'] = $countPreg;
                                $seccionesPorcentaje[] = (object)$sectionData;

                                $preguntasTotales += $countPreg;
                            }
                        }

                        $porcentaje->secciones = $seccionesPorcentaje;

                        if ($total === 0 && $preguntasTotales > 0) {
                            if (intval($examen->forma) === 1) {
                                $puntajePAA = $this->obtenerPuntajePAA($porcentaje->nombre, $aciertosTotales);
                                $porcentaje->promedio = $puntajePAA;
                                $porcentaje->totalPromedio = ($puntajePAA - 200) / 12;
                            } else {
                                $porcentaje->promedio = ($aciertosTotales / $preguntasTotales) * 100;
                                $porcentaje->totalPromedio = ($aciertosTotales / $preguntasTotales) * floatval($porcentaje->porcentaje);
                            }
                            $porcentajeFinal += floatval($porcentaje->porcentaje);
                        } else {
                            $porcentaje->promedio = 0;
                            $porcentaje->totalPromedio = 0;
                        }
                        $respuesta[] = $porcentaje;
                    }
                } else {
                    // FALLBACK 2: Secciones directly from secciones table
                    $seccionesDirectas = Seccione::where('idExamen', '=', $idExamen)->where('eliminado', '=', 0)->get();
                    if (count($seccionesDirectas) > 0) {
                        $aciertosTotales = 0;
                        $preguntasTotales = 0;
                        $totalCalificadas = 0;

                        $secList = array();
                        foreach ($seccionesDirectas as $sec) {
                            $countPreg = intval($sec->totalPreguntas) > 0 ? intval($sec->totalPreguntas) : count(Pregunta::where('idSeccion', '=', $sec->id)->where('eliminado', '=', 0)->get());

                            $resultado = Calificacione::where('idFicha', '=', $idFicha)
                                                        ->where('idExamen', '=', $idExamen)
                                                        ->where('idSeccion', '=', $sec->id)
                                                        ->first();

                            $secData = new \stdClass();
                            $secData->seccion = $sec->nombre;
                            $secData->idSeccion = $sec->id;
                            $secData->totalPreguntas = $countPreg;

                            if ($resultado) {
                                $secData->aciertos = $resultado->aciertos;
                                $secData->errores = $resultado->errores;
                                $secData->ausentes = $resultado->ausentes;
                                $aciertosTotales += intval($resultado->aciertos);
                                $preguntasTotales += $countPreg;
                                $totalCalificadas++;
                            } else {
                                $secData->aciertos = '';
                                $secData->errores = '';
                                $secData->ausentes = '';
                                $preguntasTotales += $countPreg;
                            }
                            $secList[] = $secData;
                        }

                        $itemObj = new \stdClass();
                        $itemObj->nombre = 'Secciones del Examen';
                        $itemObj->porcentaje = 100;
                        $itemObj->secciones = $secList;

                        if ($totalCalificadas === count($seccionesDirectas) && $preguntasTotales > 0) {
                            if (intval($examen->forma) === 1) {
                                $puntajePAA = $this->obtenerPuntajePAA('Lectura', $aciertosTotales);
                                $itemObj->promedio = $puntajePAA;
                                $itemObj->totalPromedio = ($puntajePAA - 200) / 6;
                            } else {
                                $itemObj->promedio = ($aciertosTotales / $preguntasTotales) * 100;
                                $itemObj->totalPromedio = ($aciertosTotales / $preguntasTotales) * 100;
                            }
                            $porcentajeFinal = 100;
                        } else {
                            $itemObj->promedio = 0;
                            $itemObj->totalPromedio = 0;
                        }
                        $respuesta[] = $itemObj;
                    }
                }
            }

            $final = array();
            if($porcentajeFinal >= 99.9){
                $promedioExamen = 0;
                foreach ($respuesta as $res) {
                    $promedioExamen += $res->totalPromedio;
                }
                if(intval($ficha->idNivel) !== 2 && $escolares){
                    $final['promedioExamen'] = number_format($promedioExamen, 2, '.');
                    $final['promedioAlumno'] = $escolares->promedio;
                    $final['puntajeCarrera'] = $carrera ? $carrera->puntaje : 0;
                    $totalDiff = (floatval($promedioExamen) + floatval($escolares->promedio)) - floatval($carrera ? $carrera->puntaje : 0);
                    $final['diferencia'] = number_format($totalDiff, 2, '.');
                    $final['colbach'] = false;
                }else{
                    $final['promedioExamen'] = number_format($promedioExamen, 2, '.');
                    $final['colbach'] = true;
                }
            }else{
                $final['promedioExamen'] = number_format(0, 2, '.');
            }

            $final['secciones'] = $respuesta;
            return response()->json($final, 200);
        } catch (\Exception $e) {
            return response()->json('Error en el servidor: ' . $e->getMessage(), 400);
        }
    }

    function guardarSecciones(Request $request) {
        try {
            DB::beginTransaction();
            foreach ($request['secciones'] as $reactivo) {
                foreach($reactivo['secciones'] as $seccion){
                    $section = Calificacione::where('idFicha', '=', $request['ficha'])->
                                          where('idSeccion', '=', $seccion['idSeccion'])->
                                          where('idExamen', '=', $request['examen'])->first();
                    
                    $seccionModel = Seccione::find($seccion['idSeccion']);
                    $totalPreguntas = ($seccionModel && intval($seccionModel->totalPreguntas) > 0) 
                        ? intval($seccionModel->totalPreguntas) 
                        : count(Pregunta::where('idSeccion', '=', $seccion['idSeccion'])->where('eliminado', '=', 0)->get());
                    
                    $aciertos = (isset($seccion['aciertos']) && strlen($seccion['aciertos']) > 0) ? intval($seccion['aciertos']) : 0;
                    $errores = (isset($seccion['errores']) && strlen($seccion['errores']) > 0) ? intval($seccion['errores']) : 0;
                    $ausentes = (isset($seccion['ausentes']) && strlen($seccion['ausentes']) > 0) ? intval($seccion['ausentes']) : 0;

                    $total = $aciertos + $errores + $ausentes;

                    if ($totalPreguntas > 0) {
                        if ($total > $totalPreguntas) {
                            return response()->json('La cantidad de respuestas en la sección ' . ($seccionModel ? $seccionModel->nombre : '') . ' (' . $total . ') es mayor al total de preguntas (' . $totalPreguntas . ')', 400);
                        }
                        if ($total < $totalPreguntas && $ausentes === 0) {
                            $ausentes = $totalPreguntas - ($aciertos + $errores);
                        }
                    }

                    if($section){
                        $registro = Calificacione::find($section->id);
                        $registro->aciertos = $aciertos;
                        $registro->errores = $errores;
                        $registro->ausentes = $ausentes;
                        $registro->totalPreguntas = $totalPreguntas;
                        $registro->save();
                    }else{
                        $registro = Calificacione::create([
                            'idFicha' => $request['ficha'],
                            'idSeccion' => $seccion['idSeccion'],
                            'idExamen' => $request['examen'],
                            'aciertos' => $aciertos,
                            'errores' => $errores,
                            'ausentes' => $ausentes,
                            'totalPreguntas' => $totalPreguntas,
                            'eliminado' => 0,
                            'activo' => 1
                        ]);
                    }
                }
            }
            DB::commit();
            return response()->json('Guardado correctamente', 200);
        } catch (\Exception $e) {
            DB::rollback();
            return response()->json('Error en el servidor: ' . $e->getMessage(), 400);
        }
    }
}