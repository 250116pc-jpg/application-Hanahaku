<?php
declare(strict_types=1);

function googleBase64UrlDecode(string $value): string
{
    $remainder = strlen($value) % 4;
    if ($remainder !== 0) {
        $value .= str_repeat('=', 4 - $remainder);
    }
    $decoded = base64_decode(strtr($value, '-_', '+/'), true);
    if ($decoded === false) {
        throw new RuntimeException('Googleトークンの形式が正しくありません。');
    }
    return $decoded;
}

function googleAsn1Length(int $length): string
{
    if ($length < 128) {
        return chr($length);
    }
    $bytes = '';
    while ($length > 0) {
        $bytes = chr($length & 0xff) . $bytes;
        $length >>= 8;
    }
    return chr(0x80 | strlen($bytes)) . $bytes;
}

function googleAsn1Integer(string $bytes): string
{
    $bytes = ltrim($bytes, "\x00");
    if ($bytes === '' || (ord($bytes[0]) & 0x80) !== 0) {
        $bytes = "\x00" . $bytes;
    }
    return "\x02" . googleAsn1Length(strlen($bytes)) . $bytes;
}

function googleAsn1Sequence(string $bytes): string
{
    return "\x30" . googleAsn1Length(strlen($bytes)) . $bytes;
}

function googleJwkToPem(array $jwk): string
{
    if (($jwk['kty'] ?? '') !== 'RSA' || !isset($jwk['n'], $jwk['e'])) {
        throw new RuntimeException('Google公開鍵の形式が正しくありません。');
    }

    $rsaPublicKey = googleAsn1Sequence(
        googleAsn1Integer(googleBase64UrlDecode((string)$jwk['n'])) .
        googleAsn1Integer(googleBase64UrlDecode((string)$jwk['e']))
    );
    $rsaAlgorithmIdentifier = hex2bin('300d06092a864886f70d0101010500');
    if ($rsaAlgorithmIdentifier === false) {
        throw new RuntimeException('公開鍵を作成できませんでした。');
    }
    $bitString = "\x03" . googleAsn1Length(strlen($rsaPublicKey) + 1) . "\x00" . $rsaPublicKey;
    $subjectPublicKeyInfo = googleAsn1Sequence($rsaAlgorithmIdentifier . $bitString);

    return "-----BEGIN PUBLIC KEY-----\n" .
        chunk_split(base64_encode($subjectPublicKeyInfo), 64, "\n") .
        "-----END PUBLIC KEY-----\n";
}

function googleFetchJwks(bool $forceRefresh = false): array
{
    $cachePath = sys_get_temp_dir() . DIRECTORY_SEPARATOR . 'hanahaku-google-jwks.json';
    if (!$forceRefresh && is_file($cachePath) && filemtime($cachePath) > time() - 21600) {
        $cached = json_decode((string)file_get_contents($cachePath), true);
        if (is_array($cached) && isset($cached['keys']) && is_array($cached['keys'])) {
            return $cached;
        }
    }

    $curl = curl_init('https://www.googleapis.com/oauth2/v3/certs');
    if ($curl === false) {
        throw new RuntimeException('Google公開鍵を取得できませんでした。');
    }
    curl_setopt_array($curl, [
        CURLOPT_RETURNTRANSFER => true,
        CURLOPT_CONNECTTIMEOUT => 5,
        CURLOPT_TIMEOUT => 10,
        CURLOPT_FOLLOWLOCATION => false,
        CURLOPT_SSL_VERIFYPEER => true,
        CURLOPT_SSL_VERIFYHOST => 2,
    ]);
    $body = curl_exec($curl);
    $status = (int)curl_getinfo($curl, CURLINFO_RESPONSE_CODE);
    $error = curl_error($curl);
    curl_close($curl);

    if (!is_string($body) || $status !== 200) {
        throw new RuntimeException($error !== '' ? 'Googleへ接続できませんでした。' : 'Google公開鍵を取得できませんでした。');
    }

    $jwks = json_decode($body, true);
    if (!is_array($jwks) || !isset($jwks['keys']) || !is_array($jwks['keys'])) {
        throw new RuntimeException('Google公開鍵の応答が正しくありません。');
    }
    @file_put_contents($cachePath, $body, LOCK_EX);
    return $jwks;
}

function googleFindJwk(string $keyId): array
{
    foreach ([false, true] as $forceRefresh) {
        $jwks = googleFetchJwks($forceRefresh);
        foreach ($jwks['keys'] as $jwk) {
            if (is_array($jwk) && hash_equals((string)($jwk['kid'] ?? ''), $keyId)) {
                return $jwk;
            }
        }
    }
    throw new RuntimeException('Google公開鍵が見つかりませんでした。');
}

function verifyGoogleIdToken(string $token, string $clientId): array
{
    $parts = explode('.', $token);
    if (count($parts) !== 3) {
        throw new RuntimeException('Googleトークンの形式が正しくありません。');
    }
    [$encodedHeader, $encodedPayload, $encodedSignature] = $parts;
    $header = json_decode(googleBase64UrlDecode($encodedHeader), true);
    $payload = json_decode(googleBase64UrlDecode($encodedPayload), true);
    if (!is_array($header) || !is_array($payload)) {
        throw new RuntimeException('Googleトークンを読み取れませんでした。');
    }
    if (($header['alg'] ?? '') !== 'RS256' || !is_string($header['kid'] ?? null)) {
        throw new RuntimeException('Googleトークンの署名方式が正しくありません。');
    }

    $signature = googleBase64UrlDecode($encodedSignature);
    $publicKey = googleJwkToPem(googleFindJwk($header['kid']));
    $verified = openssl_verify(
        $encodedHeader . '.' . $encodedPayload,
        $signature,
        $publicKey,
        OPENSSL_ALGO_SHA256
    );
    if ($verified !== 1) {
        throw new RuntimeException('Googleトークンの署名を確認できませんでした。');
    }

    $issuer = (string)($payload['iss'] ?? '');
    if ($issuer !== 'accounts.google.com' && $issuer !== 'https://accounts.google.com') {
        throw new RuntimeException('Googleトークンの発行元が正しくありません。');
    }
    $audience = $payload['aud'] ?? null;
    $audienceMatches = is_string($audience)
        ? hash_equals($clientId, $audience)
        : is_array($audience) && in_array($clientId, $audience, true);
    if (!$audienceMatches) {
        throw new RuntimeException('GoogleクライアントIDが一致しません。');
    }
    if (!is_numeric($payload['exp'] ?? null) || (int)$payload['exp'] <= time()) {
        throw new RuntimeException('Googleログインの有効期限が切れています。');
    }
    if (isset($payload['nbf']) && is_numeric($payload['nbf']) && (int)$payload['nbf'] > time() + 60) {
        throw new RuntimeException('Googleトークンをまだ利用できません。');
    }
    if (($payload['email_verified'] ?? false) !== true && ($payload['email_verified'] ?? '') !== 'true') {
        throw new RuntimeException('Googleで確認済みのメールアドレスが必要です。');
    }
    foreach (['sub', 'email'] as $required) {
        if (!is_string($payload[$required] ?? null) || trim($payload[$required]) === '') {
            throw new RuntimeException('Googleアカウント情報が不足しています。');
        }
    }

    return $payload;
}
