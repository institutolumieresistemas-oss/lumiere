<?php
	$router->get('reactivos/catalogo', ['uses' => 'ReactivosController@catalogo']);
	$router->post('reactivos/nuevo', ['uses' => 'ReactivosController@nuevo']);
	$router->post('reactivos/modificar', ['uses' => 'ReactivosController@modificar']);
	$router->post('reactivos/eliminar', ['uses' => 'ReactivosController@eliminar']);
	$router->post('reactivos/asociarSecciones', ['uses' => 'ReactivosController@asociarSecciones']);
?>
