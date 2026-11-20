<?php
	$router->post('calififcaciones/examenes', ['uses' => 'CalififcacionesController@examenes']);
	$router->post('calificaciones/recibirLumiereSocial', ['uses' => 'CalificacionesController@recibirLumiereSocial']);
?>