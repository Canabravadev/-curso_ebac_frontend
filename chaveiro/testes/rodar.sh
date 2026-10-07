#!/bin/sh
# Roda os testes do Chaveiro (navegador + conferência do Excel). Sai com erro se algo falhar.
# COMPLETO=1 roda também o robô do caos e os backups estragados (mais demorado).
# Requer: Node com Playwright, Chromium e Python 3 com openpyxl.
cd "$(dirname "$0")/../.." || exit 1
node chaveiro/testes/testes.js || exit 1
if [ -n "$COMPLETO" ]; then
  for s in 1 2; do node chaveiro/testes/caos.js $s 400 1366 || exit 1; done
  node chaveiro/testes/caos.js 3 400 390 || exit 1
  node chaveiro/testes/backup_estragado.js 1 150 || exit 1
fi
