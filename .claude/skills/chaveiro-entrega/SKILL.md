---
name: chaveiro-entrega
description: Lista para entregar uma mudança no app Chaveiro (testes, conferências, commit, push, envio do HTML e relatório em português simples). Use ao terminar qualquer mudança no app, quando pedirem o arquivo atualizado, ou antes de dizer que algo está pronto.
---

# Entrega

1. `./chaveiro/testes/rodar.sh` passou sem FALHA. Use `COMPLETO=1` se mexeu em gravação, backup ou restauração.
   Nenhum PULADO fica sem explicação.
2. Olhe de verdade as telas que mudaram (Playwright, 1366×768, tema claro e escuro) e compare com o antes.
   O visual que já existe não muda sem aprovação.
3. Se usou dados reais: o arquivo enviado continua com o mesmo sha256 e nada dele entrou no repositório.
   Confira com `git status` e `git diff --stat`.
4. Faça o commit em português, dizendo o que muda para quem usa. Faça o push na branch de trabalho; em outra,
   só se pedirem. Pull request também só se pedirem.
5. Mande `chaveiro/Chaveiro_Vendas_e_Gastos.html` como arquivo para baixar (SendUserFile com display "attach").
6. Escreva um relatório curto, em português simples e sem termos técnicos:
   - o que mudou na tela e como usar;
   - o que foi testado, com números;
   - o que ficou de fora e por quê.
   Ideias novas vão no fim, para aprovar (veja a skill chaveiro-laboratorio).
