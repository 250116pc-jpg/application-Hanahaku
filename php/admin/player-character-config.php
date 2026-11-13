<?php
declare(strict_types=1);

function readGlobalPlayerCharacter(): string
{
    $path = __DIR__ . '/player-character.json';
    if (!is_file($path)) return 'male';

    $contents = file_get_contents($path);
    if ($contents === false) throw new RuntimeException('主人公設定ファイルを読み込めません。');
    $settings = json_decode($contents, true, 512, JSON_THROW_ON_ERROR);
    $character = is_array($settings) ? ($settings['character'] ?? null) : null;
    if (!is_string($character) || !in_array($character, ['male', 'female'], true)) {
        throw new RuntimeException('主人公設定の形式が正しくありません。');
    }
    return $character;
}

function writeGlobalPlayerCharacter(string $character): void
{
    if (!in_array($character, ['male', 'female'], true)) {
        throw new InvalidArgumentException('主人公を選択してください。');
    }

    $path = __DIR__ . '/player-character.json';
    $temporaryPath = tempnam(__DIR__, '.player-character-');
    if ($temporaryPath === false) throw new RuntimeException('主人公設定ファイルを作成できません。');

    $contents = json_encode(['character' => $character], JSON_UNESCAPED_UNICODE | JSON_THROW_ON_ERROR);
    if (file_put_contents($temporaryPath, $contents, LOCK_EX) === false) {
        unlink($temporaryPath);
        throw new RuntimeException('主人公設定を保存できません。');
    }
    if (!rename($temporaryPath, $path)) {
        unlink($temporaryPath);
        throw new RuntimeException('主人公設定を更新できません。');
    }
}
