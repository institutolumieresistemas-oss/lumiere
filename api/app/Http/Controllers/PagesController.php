<?php

namespace App\Http\Controllers;

use App\Page;
use App\Altacurso;
use Carbon\Carbon;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Validator;
use Illuminate\Support\Str;
use Intervention\Image\ImageManagerStatic as Image;

class PagesController extends Controller
{

    public function mostrar(){
        return Page::select('id','name','slug')->get();
    }

    public function traer(Request $request){
        $pagina = Page::find($request['id']);
        return response()->json($pagina, 200);
    }

    public function contenido(Request $request){

        $page = Page::findOrFail($request->input('id'));

        $content = $request->input('content');

        $imagenesAntes = $this->extraerImagenes($page->content ?? []);

        $content = $this->procesarElementos($content,$page->id);

        $imagenesDespues = $this->extraerImagenes($content);

        $page->content = $content;
        $page->save();

        $this->limpiarImagenes($imagenesAntes,$imagenesDespues);

        return response()->json([
            'ok'=>true,
            'content'=>$page->content
        ]);
    }

    public function nuevo(Request $request){

        $validator = Validator::make($request->all(),[
            'nombre'=>'required|string|max:150',
        ]);

        if($validator->fails()){
            return response()->json($validator->errors(),422);
        }

        $page = Page::create([
            'name'=>$request->nombre,
            'slug'=>'/'.strtolower($request->nombre),
            'status'=>'draft',
            'content'=>[
                'version'=>1,
                'elements'=>[]
            ]
        ]);

        $this->crearCarpetaPagina($page->id);

        return response()->json($page,201);
    }

    public function cursos(){

        $hoy = Carbon::today();

        $cursos = Altacurso::query()
            ->join('calendarios','altacursos.idCalendario','=','calendarios.id')
            ->join('cursos','altacursos.idCurso','=','cursos.id')
            ->join('modalidades','altacursos.idModalidad','=','modalidades.id')
            ->where('calendarios.activo',1)
            ->where('calendarios.eliminado',0)
            ->whereDate('calendarios.fin','>=',$hoy)
            ->where('altacursos.activo',1)
            ->where('altacursos.eliminado',0)
            ->orderBy('calendarios.id','desc')
            ->select([
                'altacursos.id',
                'altacursos.precio',
                'altacursos.inicio',
                'altacursos.fin',
                'altacursos.limitePago',
                'altacursos.eliminado',
                'calendarios.nombre as calendario_nombre',
                'cursos.nombre as curso_nombre',
                'cursos.icono as curso_imagen',
                'modalidades.nombre as modalidad_nombre'
            ])
            ->get();

        foreach ($cursos as $curso) {
            $grupos = \App\Grupo::join('horarios', 'grupos.idHorario', '=', 'horarios.id')
                ->leftJoin('turnos', 'grupos.idTurno', '=', 'turnos.id')
                ->select([
                    'turnos.nombre as turno',
                    'horarios.inicio',
                    'horarios.fin'
                ])
                ->where('grupos.idAltaCurso', $curso->id)
                ->where('grupos.eliminado', 0)
                ->where('grupos.activo', 1)
                ->get();

            $horarios = [];
            foreach ($grupos as $grupo) {
                $turnoStr = $grupo->turno ? ($grupo->turno . ': ') : '';
                $horarios[] = $turnoStr . $grupo->inicio . ' - ' . $grupo->fin;
            }
            $curso->horarios = $horarios;
        }

        return $cursos;
    }

    /* ============================= */

    private function crearCarpetaPagina($pageId){

        $ruta = base_path('uploads/'.$pageId);

        if(!file_exists($ruta)){
            mkdir($ruta,0777,true);
        }
    }

    private function procesarElementos($content,$pageId){

        if(!isset($content['elements'])) return $content;

        foreach($content['elements'] as $i=>$element){

            $tipo = $element['type'];

            $content['elements'][$i]['props'] =
                $this->procesarImagenes($element['props'],$tipo,$pageId);

        }

        return $content;
    }

    private function procesarImagenes($data,$tipo,$pageId){

        if(is_array($data)){

            foreach($data as $key=>$value){

                if(is_string($value) && (str_contains($value,'data:image') || str_contains($value,'data:application/pdf'))){

                    $data[$key] = $this->procesarTextoConImagenes($value,$tipo,$pageId);

                }
                elseif(is_array($value)){

                    $data[$key] = $this->procesarImagenes($value,$tipo,$pageId);

                }

            }

        }

        return $data;
    }

    /* ============================= */

    private function procesarTextoConImagenes($texto, $tipo, $pageId){

        $pattern = '/data:(image|application)\/(\w+);base64,([A-Za-z0-9+\/=\s]+)/';

        return preg_replace_callback($pattern, function($matches) use ($tipo, $pageId) {
            $typeGroup = $matches[1];
            $extension = $matches[2];
            $base64Data = $matches[3];
            
            // Eliminar espacios en blanco y saltos de línea de la cadena base64
            $base64Data = preg_replace('/\s+/', '', $base64Data);
            
            $archivoBin = base64_decode($base64Data);
            if (!$archivoBin) {
                return $matches[0];
            }

            $hash = md5($archivoBin);
            $carpeta = base_path("uploads/$pageId/$tipo");

            if (!file_exists($carpeta)) {
                mkdir($carpeta, 0777, true);
            }

            $archivo = "$carpeta/$hash.$extension";

            if (!file_exists($archivo)) {
                file_put_contents($archivo, $archivoBin);
            }

            return url("/uploads/$pageId/$tipo/$hash.$extension");
        }, $texto);

    }

    /* ============================= */

    private function extraerImagenes($data){

        $imagenes=[];

        if(is_array($data)){

            foreach($data as $value){

                if(is_string($value)){
                    $base_url = url('/');
                    $escaped_base = preg_quote($base_url, '/');
                    preg_match_all('/' . $escaped_base . '\/uploads\/[a-zA-Z0-9\-_\/]+\.[a-zA-Z0-9]+/i', $value, $matches);
                    if (!empty($matches[0])) {
                        $imagenes = array_merge($imagenes, $matches[0]);
                    }
                }
                elseif(is_array($value)){
                    $imagenes=array_merge($imagenes,$this->extraerImagenes($value));
                }

            }

        }

        return $imagenes;
    }

    private function limpiarImagenes($antes,$despues){

        $eliminar=array_diff($antes,$despues);

        foreach($eliminar as $url){

            $ruta=str_replace(url('/'),'', $url);

            $archivo=base_path($ruta);

            if(file_exists($archivo)){
                unlink($archivo);
            }

        }

    }

}