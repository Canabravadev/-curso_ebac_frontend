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
- JavaScript ES5 dentro de uma IIFE, sem bibliotecas externas e sem rede.
- Textos para o usuário em português simples, sem termos técnicos.
- Dados reais da loja nunca entram no repositório. Testes usam só `chaveiro/testes/dados.js`.

## Dados (localStorage)
`chaveiro_vendas_v2`, `chaveiro_despesas_v1`, `chaveiro_estoque_v1`, `chaveiro_meta_v1`,
`chaveiro_extras_v1` (`{cfg, fixos, encomendas, procuras, contagens, entradas, retrabalhos, fresa}`).
Valores grandes podem ir para o IndexedDB `chaveiro_dados` (marcador `@idb:` no localStorage).
Toda gravação passa por `commit()`. Os extras entram no backup, na restauração e no arquivo sincronizado.

## Testes
`./chaveiro/testes/rodar.sh` — abre o app no Chromium com relógio fixo (20/10/2026) e dados de
exemplo: venda do estoque, pagamento dividido, fiado, gasto, persistência, backup/restauração,
dados antigos e o Excel (conferido por `confere_excel.py`, que recalcula tudo a partir dos dados).
Rode antes de cada commit. `MANTER=1` guarda os arquivos gerados.
