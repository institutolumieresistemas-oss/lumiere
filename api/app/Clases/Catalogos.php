<?php
	namespace App\Clases;
	use App\Formaspago;
	use Illuminate\Support\Facades\DB;
	use Exception;

	class Catalogos{
		function formasPagos(){
			try {
				return Formaspago::where('eliminado', '=', 0)->where('activo', '=', 1)->get();
			} catch (Exception $e) {
				return null;
			}
		}
	}

	
?>