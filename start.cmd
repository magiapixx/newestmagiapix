@echo off
setlocal
set "PORT=4173"
set "NODE=node"

if exist "%~dp0..\.setup\node\node-v24.22.1-win-x64\node.exe" set "NODE=%~dp0..\.setup\node\node-v24.22.1-win-x64\node.exe"
if exist "%~dp0node\node.exe" set "NODE=%~dp0node\node.exe"

echo Starting Mondragon site at http://localhost:%PORT%
start "" powershell -NoProfile -WindowStyle Hidden -Command "Start-Sleep -Seconds 2; Start-Process 'http://localhost:%PORT%'"
"%NODE%" "%~dp0serve.js" %PORT%
