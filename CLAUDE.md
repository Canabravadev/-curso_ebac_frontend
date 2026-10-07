# Chaveiro — Vendas e Gastos

App de um arquivo só (`chaveiro/Chaveiro_Vendas_e_Gastos.html`) usado no balcão de uma loja de chaves:
registra vendas (estoque, chaves, serviços, "Outros"), estoque, gastos, fiado, encomendas e
retrabalhos, mostra o resumo do mês e gera o Excel mensal da contadora. Funciona offline,
direto do arquivo, no celular e no PC. A dona usa todo dia: estabilidade vem antes de novidade.

## Regras
- Nunca perder, alterar ou duplicar dados salvos. Manter compatível com dados e backups antigos
  (chaves do localStorage, formato das vendas, IDs, backup/restauração, sincronização com arquivo).
- Nunca inventar informação (nem no app, nem no Excel). O Excel é só leitura dos dados: 7 abas
  (Resumo, Vendas, Itens das vendas, Gastos, Pagamentos, Fiado, Recebimentos), sem estoque,
  sem conferências internas, sem contabilidade inventada.
- Não redesenhar o visual existente. Componentes novos usam as peças que já existem
  (`.field-wrap`, `.money-input`, `.registrar-btn`, `.est-btn`, `.pay-btn`, `.pill`, `.tag`, `details.card`...).
- JavaScript ES5 dentro de uma IIFE, sem bibliotecas externas e sem rede. Nada é carregado da internet:
  as fontes (Fraunces, IBM Plex Sans, JetBrains Mono, só latim) e o ícone estão embutidos no arquivo.
- Alvo: Chrome no Android e no PC (iPhone não é usado).
- Textos para o usuário em português simples, sem termos técnicos.
- Dados reais da loja nunca entram no repositório. Testes usam só `chaveiro/testes/dados.js`.

## Dados (localStorage)
`chaveiro_vendas_v2`, `chaveiro_despesas_v1`, `chaveiro_estoque_v1`, `chaveiro_meta_v1`,
`chaveiro_extras_v1` (`{cfg, fixos, encomendas, procuras, contagens, entradas, retrabalhos, fresa, lixeira}`).
Valores grandes podem ir para o IndexedDB `chaveiro_dados` (marcador `@idb:` no localStorage).
Toda gravação passa por `commit()`. Os extras entram no backup, na restauração e no arquivo sincronizado.
Venda ou gasto apagado vai para `lixeira` (60 dias) no mesmo commit. Cópias automáticas diárias (7) ficam no
IndexedDB `chaveiro_copias` (só neste navegador). Preferências do aparelho (ex.: tamanho do texto) ficam em `chaveiro_ui_v1`; a venda em andamento em
`chaveiro_rascunho_v1` (apagada ao registrar; nunca vira venda sozinha).

## Testes
`./chaveiro/testes/rodar.sh` — abre o app no Chromium com relógio fixo (20/10/2026) e dados de
exemplo: venda do estoque, pagamento dividido, fiado, gasto, persistência, backup/restauração,
valores mais cobrados, venda em andamento que volta ao recarregar, apagados recentemente, cópias automáticas, comparação com o mês passado, tamanho do
texto, aviso ao sair com venda pela metade, enviar backup/Excel e tela acesa (Android simulado), funcionar sem internet, dados antigos e o Excel (conferido por `confere_excel.py`, que recalcula tudo a partir dos dados).
Rode antes de cada commit. `MANTER=1` guarda os arquivos gerados.
`COMPLETO=1 ./chaveiro/testes/rodar.sh` também roda `caos.js` (robô com ações aleatórias e vendas completas,
conferindo as regras dos dados a cada ação) e `backup_estragado.js` (restaura backups corrompidos: nada local
pode sumir, mudar ou duplicar). Rode o completo antes de mexer em gravação, backup ou restauração.
