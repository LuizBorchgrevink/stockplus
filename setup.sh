#!/usr/bin/env bash
set -e
cd "$(dirname "$0")"

if ! command -v node >/dev/null 2>&1; then
  echo
  echo "No se encontro Node.js."
  echo "Descarga e instala la version LTS desde https://nodejs.org/"
  echo "Despues vuelve a ejecutar: bash setup.sh"
  echo
  exit 1
fi

node scripts/setup.js
