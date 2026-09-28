@echo off
REM プロジェクトルートで Vite 開発サーバーを起動し、ブラウザを開くバッチ
cd /d "%~dp0"
echo ===== Vite 開発サーバーを起動します =====
start "Vite Dev Server" cmd /k "npm run dev -- --host 127.0.0.1"
timeout /t 2 /nobreak >nul
start "" http://127.0.0.1:5173
echo ===== もしブラウザが開かない場合は手動で http://127.0.0.1:5173 を開いてください =====
