#!/bin/bash
# Prepara as ferramentas de verificação do Chaveiro nas sessões do Claude Code na nuvem.
# Node, Playwright, Chromium e Python com openpyxl já vêm na máquina da nuvem; aqui entram:
#   ESLint + eslint-plugin-compat + globals (lint.js), axe-core (acessibilidade.js),
#   LibreOffice Calc e .NET 8 com o validador da Microsoft (valida_excel.py).
# Fora da nuvem não faz nada. Pode rodar várias vezes: só instala o que falta.
# Se algo não instalar, a sessão segue e os testes mostram essa parte como PULADO.
set -uo pipefail

if [ "${CLAUDE_CODE_REMOTE:-}" != "true" ]; then
  exit 0
fi

FERR="${CHAVEIRO_FERRAMENTAS:-$HOME/.cache/chaveiro-ferramentas}"
REPO="${CLAUDE_PROJECT_DIR:-$(cd "$(dirname "$0")/../.." && pwd)}"
falhou=""
mkdir -p "$FERR"

# versões fixas: um teste não pode começar a falhar só porque saiu versão nova de uma ferramenta.
# Para atualizar, troque aqui, rode os testes e trate o que a versão nova encontrar.
NPM_PACOTES="eslint@9.39.5 eslint-plugin-compat@7.0.2 globals@17.13.0 axe-core@4.13.0"
if [ "$(cat "$FERR/versoes-npm.txt" 2>/dev/null)" != "$NPM_PACOTES" ]; then
  npm install --prefix "$FERR" --save-exact --no-audit --no-fund --loglevel=error $NPM_PACOTES >&2 &&
    echo "$NPM_PACOTES" > "$FERR/versoes-npm.txt" || falhou="$falhou ESLint/axe-core"
fi

pacotes=""
command -v soffice >/dev/null 2>&1 || pacotes="$pacotes libreoffice-calc"
command -v dotnet >/dev/null 2>&1 || pacotes="$pacotes dotnet-sdk-8.0"
if [ -n "$pacotes" ]; then
  { DEBIAN_FRONTEND=noninteractive apt-get update -qq &&
    DEBIAN_FRONTEND=noninteractive apt-get install -y -qq --no-install-recommends $pacotes; } >&2 || falhou="$falhou$pacotes"
fi

# validador da Microsoft (Open XML SDK): compilado fora do repositório, de novo só se o código mudar
OXV="$REPO/chaveiro/testes/oxv"
if command -v dotnet >/dev/null 2>&1 &&
   { [ ! -f "$FERR/oxv/oxv.dll" ] || [ "$OXV/Program.cs" -nt "$FERR/oxv/oxv.dll" ] || [ "$OXV/oxv.csproj" -nt "$FERR/oxv/oxv.dll" ]; }; then
  rm -rf "$FERR/oxv-src" && mkdir -p "$FERR/oxv-src" && cp "$OXV/Program.cs" "$OXV/oxv.csproj" "$FERR/oxv-src/" &&
    DOTNET_CLI_TELEMETRY_OPTOUT=1 DOTNET_NOLOGO=1 dotnet build "$FERR/oxv-src" -c Release -o "$FERR/oxv" --nologo -v q >&2 ||
    falhou="$falhou validador-da-Microsoft"
fi

if [ -n "$falhou" ]; then
  echo "Chaveiro: não deu para preparar:$falhou. Os testes mostram essas partes como PULADO."
else
  echo "Chaveiro: ferramentas de verificação prontas em $FERR (ESLint, axe-core, LibreOffice, validador da Microsoft)."
fi
exit 0
