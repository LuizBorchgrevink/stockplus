@echo off
chcp 65001 >nul
cd /d "%~dp0"
title StockPlus - Instalacion

where node >nul 2>nul
if errorlevel 1 (
  echo.
  echo No se encontro Node.js.
  echo Descarga e instala la version LTS desde https://nodejs.org/
  echo Despues vuelve a ejecutar este archivo.
  echo.
  pause
  exit /b 1
)

node scripts\setup.js
if errorlevel 1 (
  echo.
  echo La instalacion no termino correctamente. Revisa el mensaje anterior.
  echo.
  pause
  exit /b 1
)

echo.
pause
