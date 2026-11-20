<?php
	$router->post('plantillasPonderacion/nuevo', ['uses' => 'PlantillasponderacionController@nuevo']);
	$router->get('plantillasPonderacion/mostrar', ['uses' => 'PlantillasponderacionController@mostrar']);
	$router->post('plantillasPonderacion/modificar', ['uses' => 'PlantillasponderacionController@modificar']);
	$router->post('plantillasPonderacion/eliminar', ['uses' => 'PlantillasponderacionController@eliminar']);
?>
