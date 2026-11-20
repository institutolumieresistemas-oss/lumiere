<?php
	$router->post('formularios/guardarClaseGratis', ['uses' => 'FormulariosController@guardarClaseGratis']);
	$router->post('formularios/guardarInformacionPersonalizada', ['uses' => 'FormulariosController@guardarInformacionPersonalizada']);
	$router->post('formularios/guardarCuponDescuento', ['uses' => 'FormulariosController@guardarCuponDescuento']);
	$router->post('formularios/kommo/lead', ['uses' => 'FormulariosController@kommoLead']);
?>