<?php
$router->post('banorte/iniciar', ['uses' => 'BanortePagosController@iniciar']);
$router->post('banorte/confirmar', ['uses' => 'BanortePagosController@confirmar']);
$router->post('banorte/consultar', ['uses' => 'BanortePagosController@consultar']);
$router->get('banorte/consultar', ['uses' => 'BanortePagosController@consultar']);
