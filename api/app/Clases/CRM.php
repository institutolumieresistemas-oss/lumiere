<?php  

  namespace App\Clases;
  use App\Prospecto;
  use App\Seguimiento;

  class CRM{

  	function existeProspecto($celular, $nombre, $apellidoPaterno, $apellidoMaterno){
  		try {
  			$celular = trim($celular);
  			$nombre = trim($nombre);
  			$apellidoPaterno = trim($apellidoPaterno);
  			$apellidoMaterno = trim($apellidoMaterno);

  			return Prospecto::where('eliminado', '=', 0)
  			->where(function($query) use ($celular, $nombre, $apellidoPaterno, $apellidoMaterno) {
  				if(!empty($celular)){
  					$query->where('celular', '=', $celular);
  				}
  				if(!empty($nombre) && !empty($apellidoPaterno)){
  					$query->orWhere(function($q) use ($nombre, $apellidoPaterno, $apellidoMaterno) {
  						$q->where('nombre', '=', $nombre)
  						  ->where('apellidoPaterno', '=', $apellidoPaterno)
  						  ->where('apellidoMaterno', '=', $apellidoMaterno);
  					});
  				}
  			})->count() > 0;
  		} catch (\Exception $e) {
  			return false;
  		}
  	}

  	function hayProspecto($datos){
  		try {
  			return !is_null($this->obtenerSeguimientoProspectoPorDatos($datos)) || !is_null($this->obtenerProspectoPorDatos($datos));
  		} catch (\Exception $e) {
  			return false;
  		}
  	}

  	function traerProspecto($celular, $nombre, $apellidoPaterno, $apellidoMaterno){
  		try {
  			$datos = [
  				'celular' => $celular,
  				'nombre' => $nombre,
  				'apellidoPaterno' => $apellidoPaterno,
  				'apellidoMaterno' => $apellidoMaterno
  			];
  			$prospecto = $this->obtenerProspectoPorDatos($datos);
  			return $prospecto ? $prospecto : false;
  		} catch (\Exception $e) {
  			return false;
  		}
  	}

  	function obtenerProspecto($datos){
  		try {
  			$prospecto = $this->obtenerProspectoPorDatos($datos);
  			return $prospecto ? $prospecto : false;
  		} catch (\Exception $e) {
  			return false;
  		}
  	}

  	function obtenerProspectoPorDatos($datos){
  		try {
  			$celular = isset($datos['celular']) ? trim($datos['celular']) : '';
  			$nombre = isset($datos['nombre']) ? trim($datos['nombre']) : '';
  			$apellidoPaterno = isset($datos['apellidoPaterno']) ? trim($datos['apellidoPaterno']) : '';
  			$apellidoMaterno = isset($datos['apellidoMaterno']) ? trim($datos['apellidoMaterno']) : '';

  			// 1. Verificar primero si existe algún prospecto con el número de celular
  			if (!empty($celular)) {
  				$prospectoCelular = Prospecto::where('celular', '=', $celular)
  					->where('eliminado', '=', 0)
  					->first();
  				if ($prospectoCelular) {
  					return $prospectoCelular;
  				}
  			}

  			// 2. Si no, comparar los nombres y apellidos
  			if (!empty($nombre) && !empty($apellidoPaterno)) {
  				$prospectoNombre = Prospecto::where('nombre', '=', $nombre)
  					->where('apellidoPaterno', '=', $apellidoPaterno)
  					->where('apellidoMaterno', '=', $apellidoMaterno)
  					->where('eliminado', '=', 0)
  					->first();
  				if ($prospectoNombre) {
  					return $prospectoNombre;
  				}
  			}

  			return null;
  		} catch (\Exception $e) {
  			return null;
  		}
  	}

  	function obtenerSeguimientoProspectoPorDatos($datos){
  		try {
  			$celular = isset($datos['celular']) ? trim($datos['celular']) : '';
  			$nombre = isset($datos['nombre']) ? trim($datos['nombre']) : '';
  			$apellidoPaterno = isset($datos['apellidoPaterno']) ? trim($datos['apellidoPaterno']) : '';
  			$apellidoMaterno = isset($datos['apellidoMaterno']) ? trim($datos['apellidoMaterno']) : '';

  			// 1. Verificar primero por celular prospectos que tengan seguimiento activo
  			if (!empty($celular)) {
  				$prospectosCelular = Prospecto::where('celular', '=', $celular)
  					->where('eliminado', '=', 0)
  					->get();

  				foreach ($prospectosCelular as $prospecto) {
  					if ($this->haySeguimientoProspecto($prospecto->id)) {
  						return $this->obtenerSeguimientoProspecto($prospecto->id);
  					}
  				}
  			}

  			// 2. Si no se encontró por celular con seguimiento, comparar por nombres y apellidos
  			if (!empty($nombre) && !empty($apellidoPaterno)) {
  				$prospectosNombre = Prospecto::where('nombre', '=', $nombre)
  					->where('apellidoPaterno', '=', $apellidoPaterno)
  					->where('apellidoMaterno', '=', $apellidoMaterno)
  					->where('eliminado', '=', 0)
  					->get();

  				foreach ($prospectosNombre as $prospecto) {
  					if ($this->haySeguimientoProspecto($prospecto->id)) {
  						return $this->obtenerSeguimientoProspecto($prospecto->id);
  					}
  				}
  			}

  			return null;
  		} catch (\Exception $e) {
  			return null;
  		}
  	}

  	function obtenerSeguimiento($id){
  		try {
  			return Seguimiento::find($id);
  		} catch (\Exception $e) {
  			return null;
  		}
  	}

  	function haySeguimientoProspecto($prospectoID){
  		try {
  			return Seguimiento::where('idProspecto', '=', $prospectoID)->
  			where(function($query){
                $query->where('estatus', '=', 0)
                ->orWhere('estatus', '=', 1);
            })->count() > 0;
  		} catch (\Exception $e) {
  			return false;
  		}
  	}

  	function obtenerSeguimientoProspecto($prospectoID){
  		try {
  			$seguimientos = Seguimiento::where('idProspecto', '=', $prospectoID)->
  			where(function($query){
                $query->where('estatus', '=', 0)
                ->orWhere('estatus', '=', 1);
            })->get();

  			return count($seguimientos) > 0 ? $seguimientos[0] : null;
  		} catch (\Exception $e) {
  			return null;
  		}
  	}
  }

?>