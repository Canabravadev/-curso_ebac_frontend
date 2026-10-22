# Ideias do Chaveiro

Como as ideias nascem: primeiro se pensa sem limite ("como criança"); depois cada ideia passa por um
filtro ("como cientista"): tem prova nos dados reais mais novos? ganha tempo ou evita erro de verdade?
arrisca algum dado salvo? já foi recusada ou já existe? dá para testar?

Nenhuma ideia entra no app sem aprovação de quem usa. Os números de cada prova ficam na conversa,
nunca aqui (dados reais da loja não entram no repositório).

## Feitas (22/10/2026)

- **Comparação justa no topo de Vendas:** hoje compara só até a mesma hora da semana passada; o dia inteiro
  aparece ao passar o mouse. Vendas "sem horário" (lançadas depois) não entram no "até esta hora", porque a hora
  delas não é conhecida; o valor delas aparece à parte na mesma linha.
- **Opções de WhatsApp tiradas** (comprovante, lembrar fiado, resumo do dia, retrato do ano, lista de compras).
  "Copiar lista" continua no Estoque.
- **"Clique" no lugar de "toque"** nos textos (o app é usado no notebook).
- **Tela de Vendas para o touchpad:** busca do estoque em cima, depois mais vendidos, "Outros" e os itens rápidos;
  dica "Ctrl+Enter também registra" embaixo do botão. Medido com o robô nas vendas reais, na tela do notebook:
  32% menos rolagens por venda.

## Testadas e deixadas de fora (medidas com o robô, não refazer)

- Barra flutuante com "Registrar" no notebook: nenhuma rolagem a menos.
- Voltar ao começo da tela depois de cada venda: piorou (mais rolagens).
- "Mais vendidos" logo abaixo da busca principal: ganho menor que a ordem escolhida.
- Tela que sobe sozinha enquanto se digita na busca do estoque: ganho pequeno (2% menos rolagens) e a tela
  andaria sozinha, o que confunde.

## Descartadas por serem de celular

O app é usado no notebook. Ficaram de fora: aviso de backup no Android, busca do estoque mais acima no
celular e "Mais vendidos" compactos no celular.

## Recusadas (não propor de novo)

- Custo e lucro por item.
- Chave virgem ligada à venda.
- Telefone no fiado.
- Reajuste de preço em lote.
- Fechamento de caixa salvo; "Conferir o caixa do dia" foi retirado a pedido.
- Resumo da semana.
- Dados da loja no comprovante.
- Pix com QR.
- Aviso para a contadora.
- Recibo.
- Completar débito/crédito das vendas antigas: são de antes do recurso existir.
- Tirar o controle clonável do estoque: foi desfeito; ele continua sendo produto do estoque.
- "Poucos dados ainda" no cartão de horários.
- "Mais refeito" só com 2 ou mais repetições.
- "De onde veio o dinheiro" no Resumo (e tirar "Mão de obra (serviços)" do cartão de formas de pagamento).
- Fornecedor em vários produtos de uma vez.
- Feriado chegando (perguntar se a loja abre, para ajustar a meta por dia).
- Gastos do dia separados em loja e pessoal na aba Gastos.
- Ritmo do estoque ("acaba em uns X dias").
- Corrigir o nome dos dias do calendário do Resumo para leitor de tela, que o axe-core 4.14 acusa
  (por isso os testes usam a 4.13).
