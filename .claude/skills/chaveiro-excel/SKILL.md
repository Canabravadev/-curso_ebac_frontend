---
name: chaveiro-excel
description: Regras e conferência do Excel mensal da contadora gerado pelo app Chaveiro (botão do Resumo). Use ao mexer em qualquer coisa que mude a planilha (abas, colunas, fórmulas, totais, gasto pessoal, pagamentos, fiado, devoluções), quando o Excel for comentado ou reclamado, ou para conferir uma planilha gerada.
---

# Excel da contadora

## Regras (não mudam sem aprovação)
- A planilha só lê os dados e não inventa nada. São 7 abas, nesta ordem: Resumo, Vendas, Itens das vendas,
  Gastos, Pagamentos, Fiado e Recebimentos.
- Não entram estoque, conferências internas, contabilidade inventada nem palavras técnicas (o conferidor
  recusa "sistema", por exemplo).
- Gasto pessoal fica fora do resultado da loja. Num mês sem gasto pessoal, a planilha sai idêntica à de antes.
- O próprio app escreve o arquivo (zip e XML), sem biblioteca. Cada fórmula já leva o valor calculado, que é
  o que a contadora vê ao abrir.

## Conferir (já faz parte do ./chaveiro/testes/rodar.sh)
1. `confere_excel.py <xlsx> <dados.json> <mês> <agora>` recalcula cada número a partir dos dados.
2. `valida_excel.py <xlsx>`:
   - o LibreOffice recalcula todas as fórmulas: nenhuma pode dar erro, e o valor do arquivo tem que ser igual
     ao recalculado;
   - o validador oficial da Microsoft (Open XML SDK, código em `chaveiro/testes/oxv/`) confere a estrutura para
     Office 2007, Office 2016 e Microsoft 365.
3. Olhe a planilha de verdade: rode `MANTER=1 node chaveiro/testes/testes.js`, abra o .xlsx com openpyxl
   (ou converta para PDF com o LibreOffice) e leia aba por aba.

## Ao mudar a planilha
- Mude o app e o `confere_excel.py` juntos.
- Gere o Excel dos dados reais mais novos antes e depois da mudança, numa pasta temporária fora do repositório
  (carregue o backup no localStorage pelo Playwright, como `testes.js` faz com `dados.js`). Compare os dois:
  o que não devia mudar tem que sair igual.
- Prove os conferidores: numa cópia do .xlsx, estrague um valor guardado ou um atributo e veja `valida_excel.py`
  acusar.
