<?php
	$router->get('preinscripciones/mostrar', ['uses' => 'PreinscripcionesController@mostrar']);
	$router->post('preinscripciones/mostrar', ['uses' => 'PreinscripcionesController@mostrar']);
	$router->post('preinscripciones/eliminar', ['uses' => 'PreinscripcionesController@eliminar']);
?>
