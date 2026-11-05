#!/usr/bin/env bash
set -e
cd "$(dirname "$0")"

if ! command -v node >/dev/null 2>&1; then
  echo
  echo "No se encontro Node.js."
  echo "Descarga e instala la version LTS desde https://nodejs.org/"
  echo "Despues vuelve a ejecutar: bash iniciar.sh"
  echo
  exit 1
fi

if [ ! -f backend/.env ]; then
  echo
  echo "Primera ejecucion: preparando StockPlus..."
  echo
  node scripts/setup.js
fi

node scripts/start.js --open
