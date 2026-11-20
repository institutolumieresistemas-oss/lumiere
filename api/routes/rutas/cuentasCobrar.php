<?php
    $router->post('cuentasCobrar/obtener', ['uses' => 'CuentasCobrarController@obtenerCuentasCobrar']);
    $router->post('cuentasPagar/obtener', ['uses' => 'CuentasCobrarController@obtenerCuentasPagar']);
?>
