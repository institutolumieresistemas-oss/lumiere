<?php
	$router->get('vacaciones/mostrar', ['uses' => 'VacacionesController@mostrar']);
	$router->post('vacaciones/nuevo', ['uses' => 'VacacionesController@nuevo']);
	$router->post('vacaciones/eliminar', ['uses' => 'VacacionesController@eliminar']);
?>
