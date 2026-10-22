---
name: chaveiro-testes
description: Rodar e escrever os testes do app Chaveiro (chaveiro/testes). Use antes de cada commit, depois de qualquer mudança no HTML do app, quando um teste falhar ou mostrar PULADO, e para criar o teste de uma função nova (venda, estoque, gasto, fiado, backup, restauração, Excel, acessibilidade).
---

# Testes do Chaveiro

## Rodar
- `./chaveiro/testes/rodar.sh` (cerca de 1,5 minuto) roda, nesta ordem:
  - `testes.js`: o app no Chromium com relógio fixo (20/10/2026) e os dados inventados de `dados.js`;
    o Excel gerado é conferido por `confere_excel.py` e aberto pelo LibreOffice e pelo validador da
    Microsoft (`valida_excel.py`);
  - `lint.js`: ESLint. Só ES5 (mais async/await), nenhuma variável inexistente, nenhum recurso que o
    Chrome do notebook não tenha;
  - `acessibilidade.js`: axe-core em 18 telas, tema claro e escuro, 1366×768.
- `COMPLETO=1 ./chaveiro/testes/rodar.sh` roda também o robô do caos (`caos.js`) e os backups estragados
  (`backup_estragado.js`). É obrigatório antes de mexer em gravação (`commit()`), backup, restauração ou
  sincronização com arquivo.
- `MANTER=1` guarda os arquivos gerados (Excel, backups) e mostra em que pasta ficaram.
- PULADO quer dizer que a ferramenta não está instalada. Rode `CLAUDE_CODE_REMOTE=true .claude/hooks/session-start.sh`.
  Na nuvem ele já roda sozinho no começo da sessão. Nunca entregue com PULADO sem dizer o motivo.
- `CHAVEIRO_HTML=/caminho/copia.html` faz `lint.js` e `acessibilidade.js` olharem uma cópia do app.

## Teste novo
- Toda função nova ganha uma seção em `testes.js`: `console.log('Nome da seção')` e depois
  `ok(condição, 'frase em português dizendo o que deveria acontecer')`.
- Abra com `abre(b, dados)` usando uma cópia dos dados (`JSON.parse(JSON.stringify(D))`). Só dados inventados:
  se faltar um caso, acrescente em `dados.js`. Dados reais nunca entram no repositório.
- Confira os dois lados: a tela mostra o certo **e** o localStorage gravou o certo, sem perder, mudar ou
  duplicar nada. Confira também `errs.length === 0` (nenhum erro de JavaScript).
- Prove que o teste pega o defeito: estrague uma cópia do app (ou desfaça a correção), rode e veja a FALHA;
  depois volte.
- Se o Excel mudou, `confere_excel.py` também muda, recalculando a regra a partir dos dados (sem copiar a
  lógica do app).

## Quando falhar
- A frase da FALHA diz o que era esperado. Para ver os arquivos, rode de novo com `MANTER=1`.
- Nunca apague nem afrouxe um teste para passar. Se a regra mudou com aprovação, mude o teste e explique
  no commit.
- As versões das ferramentas são fixas no gancho (`.claude/hooks/session-start.sh`). Ao atualizar uma, trate
  o que a versão nova encontrar antes de seguir.
