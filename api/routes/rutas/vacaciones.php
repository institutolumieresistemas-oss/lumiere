<?php
	$router->get('vacaciones/mostrar', ['uses' => 'VacacionesController@mostrar']);
	$router->post('vacaciones/nuevo', ['uses' => 'VacacionesController@nuevo']);
	$router->post('vacaciones/eliminar', ['uses' => 'VacacionesController@eliminar']);
	$router->post('vacaciones/cambiar-estatus', ['uses' => 'VacacionesController@cambiarEstatus']);
	$router->get('vacaciones/notificaciones', ['uses' => 'VacacionesController@notificaciones']);
	$router->post('vacaciones/marcar-leida', ['uses' => 'VacacionesController@marcarLeida']);
?>
