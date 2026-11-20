<?php
    // Rutas de preinscripcion
	$router->get('preinscripciones/catalogos', ['uses' => 'PreinscripcionesController@catalogos']);
	$router->post('preinscripciones/guardar', ['uses' => 'PreinscripcionesController@guardar']);
?>
