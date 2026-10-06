#!/bin/sh
# Roda todos os testes do Chaveiro (navegador + conferência do Excel). Sai com erro se algo falhar.
# Requer: Node com Playwright, Chromium e Python 3 com openpyxl.
cd "$(dirname "$0")/../.." && exec node chaveiro/testes/testes.js
