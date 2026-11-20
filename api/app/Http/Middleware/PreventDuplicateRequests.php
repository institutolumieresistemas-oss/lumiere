<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;

class PreventDuplicateRequests
{
    private const COOLDOWN_SEGUNDOS = 2.0;

    private const PREFIJOS_SOLO_LECTURA = [
        'estadisticas/',
        'estadisticasMaestras/',
        'reportes/',
        'pdf/',
        'balanceCalendarios/',
        'cuentasCobrar/',
        'cuentasPagar/',
        'respaldos/',
        'cursoslumiere/',
        'calififcaciones/',
        'telegram/',
    ];

    private const RUTAS_SOLO_LECTURA = [
        'token',
        'contras/alumnos',
        'promocion',
        'cupon',
        'empresas',
        'guia',
        'solicitudes',
        'auditorias/ingresos',
        'auditorias/financierosIngreso',
        'auditorias/posiblesIngresos',
        'banorte/consultar',
        'calificador/alumnos',
        'calificador/grupos',
        'calificador/horarios',
        'calificador/mostrar',
        'configuracionesVentas/traerComisionesCurso',
        'crm/confirmarPassword',
        'crm/esVentas',
        'cupones/cursosCongelados',
        'desarrollo/databases/buscar',
        'desarrollo/databases/recientes',
        'desarrollo/databases/tablas',
        'desarrollo/testing',
        'desarrollo/verPassword',
        'empleados/busquedaNombre',
        'empleados/imagenes',
        'empleados/sucursales',
        'empleados/sucursalesAsignadas',
        'egresos/gerentes',
        'ingresos/gerentes',
        'ingresos/cargar',
        'ingresos/voucher',
        'fichas/estadoCuenta',
        'inscripciones/cupo',
        'inscripciones/existeAlumno',
        'inscripciones/horarioBloqueado',
        'nominas/autorizadas',
        'nominas/cuenta',
        'nominas/nomina',
        'pages/contenido',
        'pages/cursos',
        'preguntas/imagen',
        'soporte/datosAlumno',
        'usuarios/datosUsuario',
        'usuarios/informacion',
        'usuarios/sugerirUsuario',
        'usuarios/verificarDisponibilidad',
        'balanceSucursales/saldoCaja',
        'balanceSucursales/saldoVale',
        'alumnos/alumno',
        'alumnos/datos',
        'alumnos/fichas',
        'alumnosdomicilios/primer',
        'asignacionProfesores/asignacion',
        'carreras/cargar',
        'comisiones/comisiones',
        'nominas/solicitudes',
        'vocacional',
    ];

    private const SEGMENTOS_SOLO_LECTURA = [
        'mostrar',
        'buscar',
        'traer',
        'obtener',
        'activos',
        'listas',
        'creadas',
        'creados',
        'recibidas',
        'posibles',
        'agregados',
        'horarios',
        'reservadas',
        'existen',
        'metas',
    ];

    private const PREFIJOS_SEGMENTO_LECTURA = [
        'traer',
        'mostrar',
        'buscar',
        'obtener',
        'verificar',
        'existe',
        'consultar',
        'respuestas',
    ];

    public function handle(Request $request, Closure $next)
    {
        $method = strtoupper($request->method());
        if (in_array($method, ['GET', 'HEAD', 'OPTIONS'], true)) {
            return $next($request);
        }

        $path = trim($request->path(), '/');
        if ($this->esRutaSoloLectura($path)) {
            return $next($request);
        }

        $lockDir = storage_path('framework/cache/locks');
        if (!is_dir($lockDir) && !@mkdir($lockDir, 0775, true) && !is_dir($lockDir)) {
            return $next($request);
        }

        $lockPath = $lockDir . DIRECTORY_SEPARATOR . 'req_' . $this->construirHash($request, $method, $path) . '.lock';
        $fp = @fopen($lockPath, 'c+');
        if ($fp === false) {
            return $next($request);
        }

        if (!@flock($fp, LOCK_EX | LOCK_NB)) {
            @fclose($fp);
            return response()->json('Operación en proceso, evita hacer doble clic.', 409);
        }

        try {
            @rewind($fp);
            $contenido = @stream_get_contents($fp);
            if ($contenido) {
                $registro = json_decode($contenido, true);
                if (is_array($registro) && isset($registro['finished_at'])) {
                    $transcurrido = microtime(true) - floatval($registro['finished_at']);
                    if ($transcurrido < self::COOLDOWN_SEGUNDOS) {
                        return response()->json('Operación duplicada bloqueada, espera un momento.', 409);
                    }
                }
            }

            $response = $next($request);
            $status = method_exists($response, 'getStatusCode') ? $response->getStatusCode() : 200;

            @rewind($fp);
            @ftruncate($fp, 0);
            if ($status >= 200 && $status < 300) {
                @fwrite($fp, json_encode([
                    'finished_at' => microtime(true),
                    'status' => $status,
                ]));
            }
            @fflush($fp);

            $this->limpiarLocksAntiguos($lockDir);

            return $response;
        } finally {
            @flock($fp, LOCK_UN);
            @fclose($fp);
        }
    }

    private function esRutaSoloLectura(string $path): bool
    {
        if (in_array($path, self::RUTAS_SOLO_LECTURA, true)) {
            return true;
        }

        foreach (self::PREFIJOS_SOLO_LECTURA as $prefijo) {
            if (strpos($path, $prefijo) === 0) {
                return true;
            }
        }

        $partes = explode('/', $path);
        $ultimoSegmento = end($partes) ?: '';

        if (in_array($ultimoSegmento, self::SEGMENTOS_SOLO_LECTURA, true)) {
            return true;
        }

        foreach (self::PREFIJOS_SEGMENTO_LECTURA as $prefijoSeg) {
            if (strpos($ultimoSegmento, $prefijoSeg) === 0) {
                return true;
            }
        }

        return false;
    }

    private function construirHash(Request $request, string $method, string $path): string
    {
        $actor = $request->header('Authorization')
            ?: ($request->input('usuarioID') ?: $request->ip());

        $payload = $request->all();
        $archivos = [];
        foreach ($request->allFiles() as $clave => $archivo) {
            if (is_array($archivo)) {
                foreach ($archivo as $sub) {
                    if ($sub) {
                        $archivos[] = $clave . ':' . $sub->getClientOriginalName() . ':' . $sub->getSize();
                    }
                }
            } elseif ($archivo) {
                $archivos[] = $clave . ':' . $archivo->getClientOriginalName() . ':' . $archivo->getSize();
            }
        }

        $serializado = json_encode([$payload, $archivos]);
        if ($serializado === false) {
            $serializado = serialize([$payload, $archivos]);
        }

        return hash('sha256', $actor . '|' . $method . '|' . $path . '|' . $serializado);
    }

    private function limpiarLocksAntiguos(string $lockDir): void
    {
        if (mt_rand(1, 100) !== 1) {
            return;
        }

        $ahora = time();
        $archivos = @glob($lockDir . DIRECTORY_SEPARATOR . 'req_*.lock');
        if (!is_array($archivos)) {
            return;
        }

        foreach ($archivos as $archivo) {
            $mtime = @filemtime($archivo);
            if ($mtime !== false && ($ahora - $mtime) > 120) {
                @unlink($archivo);
            }
        }
    }
}
