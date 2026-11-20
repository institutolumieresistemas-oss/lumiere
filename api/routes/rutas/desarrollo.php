<?php
	$router->post('desarrollo/verPassword', ['uses' => 'DesarrolloController@verPassword']);
	$router->post('desarrollo/testing', ['uses' => 'DesarrolloController@testing']);
	$router->get('desarrollo/databases/tablas', ['uses' => 'DesarrolloController@tablas']);
	$router->post('desarrollo/databases/tablas', ['uses' => 'DesarrolloController@tablas']);
	$router->post('desarrollo/databases/buscar', ['uses' => 'DesarrolloController@buscarRegistro']);
	$router->post('desarrollo/databases/recientes', ['uses' => 'DesarrolloController@registrosRecientes']);
	$router->post('desarrollo/databases/modificar', ['uses' => 'DesarrolloController@modificarRegistro']);
	$router->post('desarrollo/databases/eliminar', ['uses' => 'DesarrolloController@eliminarRegistro']);
?>