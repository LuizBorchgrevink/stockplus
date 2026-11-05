@echo off
chcp 65001 >nul
cd /d "%~dp0"
title StockPlus

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

if not exist "backend\.env" (
  echo.
  echo Primera ejecucion: preparando StockPlus...
  echo.
  node scripts\setup.js
  if errorlevel 1 (
    echo.
    echo No se pudo completar la configuracion. Revisa el mensaje anterior.
    echo.
    pause
    exit /b 1
  )
)

node scripts\start.js --open
if errorlevel 1 (
  echo.
  echo StockPlus no pudo iniciarse. Revisa el mensaje anterior.
  echo.
  pause
)
