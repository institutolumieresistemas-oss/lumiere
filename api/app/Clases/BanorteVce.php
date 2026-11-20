<?php

namespace App\Clases;

use phpseclib3\File\X509;
use phpseclib3\Crypt\RSA;
use phpseclib3\Crypt\PublicKeyLoader;

class BanorteVce
{
    private $merchantId;
    private $terminalId;
    private $name;
    private $password;
    private $mode;
    private $merchantName;
    private $merchantCity;
    private $certPath;

    public function __construct()
    {
        $this->merchantId = env('BANORTE_MERCHANT_ID', '7000002');
        $this->terminalId = env('BANORTE_TERMINAL_ID', '12348');
        $this->name = env('BANORTE_USER', 'USRTEST');
        $this->password = env('BANORTE_PASSWORD', 'P@ss1234');
        $this->mode = env('BANORTE_MODE', 'AUT'); // AUT, DEC, RND, PRD
        $this->merchantName = env('BANORTE_MERCHANT_NAME', 'INSTITUTO LUMIERE');
        $this->merchantCity = env('BANORTE_MERCHANT_CITY', 'GUADALAJARA');

        $customCert = env('BANORTE_CERT_PATH');
        if ($customCert) {
            $this->certPath = file_exists($customCert) ? $customCert : base_path($customCert);
        } else {
            $this->certPath = base_path('storage/certificates/multicobros.cer');
        }
    }

    /**
     * Limpia caracteres especiales y acentos conforme a las reglas de Banorte (Manual pág. 7)
     */
    public function sanitizarTexto($texto, $longitudMaxima = null)
    {
        if ($texto === null || $texto === '') {
            return '';
        }

        $texto = str_replace(
            ['á', 'é', 'í', 'ó', 'ú', 'Á', 'É', 'Í', 'Ó', 'Ú', 'ñ', 'Ñ', 'ü', 'Ü'],
            ['a', 'e', 'i', 'o', 'u', 'A', 'E', 'I', 'O', 'U', 'n', 'N', 'u', 'U'],
            $texto
        );

        // Remover caracteres prohibidos por Banorte: < > | ¡ ! ¿ ? * + ' / \ { } [ ] ¨ # $ % & ( ) = ; : "
        $texto = preg_replace('/[<>|¡!¿?*+\'\/\\\\{}\[\]¨#\$%&()=;:",]/', ' ', $texto);
        $texto = preg_replace('/\s+/', ' ', $texto);
        $texto = trim($texto);

        if ($longitudMaxima !== null && strlen($texto) > $longitudMaxima) {
            $texto = substr($texto, 0, $longitudMaxima);
        }

        return $texto;
    }

    /**
     * Genera passphrase de 16 caracteres (Manual pág. 18)
     */
    private function generarPassphrase()
    {
        $chars = '0123456789ABCDEFGHIJKLMNOPQRSTUVWXTZabcdefghiklmnopqrstuvwxyz*&-%/!?*+=()';
        $len = strlen($chars);
        $pass = '';
        for ($i = 0; $i < 16; $i++) {
            $pass .= $chars[random_int(0, $len - 1)];
        }
        return $pass;
    }

    /**
     * Genera 16 bytes aleatorios y retorna sus 32 caracteres hexadecimales
     */
    private function generarHex16()
    {
        return bin2hex(random_bytes(16));
    }

    /**
     * Obtiene la llave pública activa de Banorte desde el endpoint o del certificado local
     */
    private function obtenerLlavePublica()
    {
        // 1. Priorizar el certificado oficial compartido en el correo de bienvenida
        if (!empty($this->certPath) && file_exists($this->certPath)) {
            $x509 = new X509();
            $x509->loadX509(file_get_contents($this->certPath));
            return $x509->getPublicKey();
        }

        // 2. En caso de no contar con archivo local, consultar endpoint o cache
        $cacheFile = storage_path('certificates/banorte_rsa.key');
        $pem = null;

        if (file_exists($cacheFile) && (time() - filemtime($cacheFile) < 86400)) {
            $pem = file_get_contents($cacheFile);
        }

        if (!$pem) {
            try {
                $ch = curl_init('https://multicobros.banorte.com/orquestador/rsa');
                curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
                curl_setopt($ch, CURLOPT_POST, true);
                curl_setopt($ch, CURLOPT_POSTFIELDS, '{}');
                curl_setopt($ch, CURLOPT_HTTPHEADER, ['Content-Type: application/json', 'Accept: text/plain; charset=utf-8']);
                curl_setopt($ch, CURLOPT_TIMEOUT, 3);
                $resp = curl_exec($ch);
                curl_close($ch);

                if ($resp) {
                    $json = json_decode($resp, true);
                    if (!empty($json['pK'])) {
                        $pem = "-----BEGIN PUBLIC KEY-----\n" . chunk_split($json['pK'], 64, "\n") . "-----END PUBLIC KEY-----";
                        @file_put_contents($cacheFile, $pem);
                    }
                }
            } catch (\Exception $e) {
                // Fallback silencioso
            }
        }

        if ($pem) {
            return PublicKeyLoader::load($pem);
        }

        throw new \Exception("No fue posible cargar la llave pública de Banorte.");
    }

    /**
     * Cifra los parámetros del cobro y genera Subcadena1:::Subcadena2
     */
    public function generarCadenaCifrada(array $datos)
    {

        $montoFloat = (float)($datos['monto'] ?? 1.00);
        if ($montoFloat < 1.00) {
            throw new \Exception("El monto mínimo permitido por Banorte es $1.00 MXN");
        }
        $amountStr = number_format($montoFloat, 2, '.', '');

        $controlNumber = $datos['controlNumber'] ?? ('LUM' . date('YmdHis') . strtoupper(substr(bin2hex(random_bytes(3)), 0, 4)));

        // Generar llaves efímeras
        $passphrase = $this->generarPassphrase();
        $viHex = $this->generarHex16();
        $saltHex = $this->generarHex16();

        $viBytes = hex2bin($viHex);
        $saltBytes = hex2bin($saltHex);

        // Estructura JSON requerida por VCE
        $jsonArray = [
            "merchantId" => (string)($datos['merchantId'] ?? $this->merchantId),
            "name" => (string)($datos['name'] ?? $this->name),
            "password" => (string)($datos['password'] ?? $this->password),
            "mode" => (string)($datos['mode'] ?? $this->mode),
            "controlNumber" => (string)$controlNumber,
            "terminalId" => (string)($datos['terminalId'] ?? $this->terminalId),
            "amount" => (string)$amountStr,
            "merchantName" => $this->sanitizarTexto($this->merchantName, 25),
            "merchantCity" => $this->sanitizarTexto($this->merchantCity, 40),
            "lang" => "ES",
        ];

        // Datos del cliente / Cybersource si se proporcionan
        if (!empty($datos['nombreCliente'])) {
            $jsonArray["billToFirstName"] = $this->sanitizarTexto($datos['nombreCliente'], 60);
        }
        if (!empty($datos['apellidosCliente'])) {
            $jsonArray["billToLastName"] = $this->sanitizarTexto($datos['apellidosCliente'], 60);
        }
        if (!empty($datos['correo'])) {
            $jsonArray["billToEmail"] = substr(trim($datos['correo']), 0, 100);
        }
        if (!empty($datos['telefono'])) {
            $jsonArray["billToPhoneNumber"] = substr(preg_replace('/[^0-9]/', '', $datos['telefono']), 0, 15);
        }
        if (!empty($datos['calle'])) {
            $jsonArray["billToStreet"] = $this->sanitizarTexto($datos['calle'], 40);
        }
        if (!empty($datos['numeroExterior'])) {
            $jsonArray["billToStreetNumber"] = $this->sanitizarTexto($datos['numeroExterior'], 6);
        }
        if (!empty($datos['colonia'])) {
            $jsonArray["billToStreet2Col"] = $this->sanitizarTexto($datos['colonia'], 30);
        }
        if (!empty($datos['municipio'])) {
            $jsonArray["billToStreet2Del"] = $this->sanitizarTexto($datos['municipio'], 30);
        }
        if (!empty($datos['ciudad'])) {
            $jsonArray["billToCity"] = $this->sanitizarTexto($datos['ciudad'], 50);
        }
        if (!empty($datos['estado'])) {
            $jsonArray["billToState"] = substr(strtoupper($this->sanitizarTexto($datos['estado'])), 0, 2);
        }
        if (!empty($datos['codigoPostal'])) {
            $jsonArray["billToPostalCode"] = substr(trim($datos['codigoPostal']), 0, 10);
        }
        if (!empty($datos['ip'])) {
            $jsonArray["billToIpAddress"] = $datos['ip'];
        }

        // Parámetros de Meses Sin Intereses (Q6) si aplica
        if (!empty($datos['mesesSinIntereses'])) {
            $meses = str_pad((string)$datos['mesesSinIntereses'], 2, '0', STR_PAD_LEFT);
            $jsonArray["initialDeferment"] = "00";
            $jsonArray["paymentsNumber"] = $meses;
            $jsonArray["planType"] = "03"; // 03 = Sin intereses
        }

        $jsonPlaintext = json_encode($jsonArray, JSON_UNESCAPED_SLASHES);

        // 1. Cifrado AES-128-CTR para Subcadena2
        $key = hash_pbkdf2('sha1', $passphrase, $saltBytes, 1000, 16, true);
        $encryptedAES = openssl_encrypt($jsonPlaintext, 'aes-128-ctr', $key, OPENSSL_RAW_DATA, $viBytes);
        $subcadena2 = base64_encode($encryptedAES);

        // 2. Cifrado RSA-OAEP para Subcadena1
        $publicKey = $this->obtenerLlavePublica();

        $pData = $viHex . "::" . $saltHex . "::" . $passphrase;
        $rsa = $publicKey->withPadding(RSA::ENCRYPTION_OAEP)
                         ->withHash('sha256')
                         ->withMGFHash('sha256');

        $encryptedRSA = $rsa->encrypt($pData);
        $subcadena1 = base64_encode($encryptedRSA);

        $cadenaFinal = $subcadena1 . ":::" . $subcadena2;

        return [
            'cadenaFinal' => $cadenaFinal,
            'controlNumber' => $controlNumber,
            'monto' => $montoFloat,
            'passphrase' => $passphrase,
            'viHex' => $viHex,
            'saltHex' => $saltHex,
            'modo' => $jsonArray['mode'],
            'payloadJson' => $jsonArray,
        ];
    }

    /**
     * Descifra la variable DATA retornada por la Ventana de Comercio Electrónico
     */
    public function descifrarRespuesta($cypherData, $passphrase, $viHex, $saltHex)
    {
        $saltBytes = hex2bin($saltHex);
        $viBytes = hex2bin($viHex);

        $key = hash_pbkdf2('sha1', $passphrase, $saltBytes, 1000, 16, true);
        $decryptedJson = openssl_decrypt(base64_decode($cypherData), 'aes-128-ctr', $key, OPENSSL_RAW_DATA, $viBytes);

        if (!$decryptedJson) {
            throw new \Exception("Falla al descifrar la respuesta de Banorte");
        }

        $data = json_decode($decryptedJson, true);
        return $data;
    }

    public function getMode()
    {
        return $this->mode;
    }
}
