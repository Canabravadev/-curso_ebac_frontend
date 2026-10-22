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

## Aprovadas, esperando a vez (22/10/2026)

- **"Outros" levando ao item certo.** Os botões "Mais usados em Outros" de chaveiro e chaverinho lançam no item
  Chaveiro, com o mesmo clique. O aviso "Já existe… usar esse item" passa a reconhecer manutenção, solda,
  elétrica, confecção, troca de miolo e abertura de fechadura; "Fiorino" (nome de carro) vira abertura de carro,
  não de porta. Continua só sugerindo. Antes de fazer: perguntar à contadora se ela precisa separar serviço de
  produto.
- **"Que horas foi?" na venda lançada depois.** Ao lançar uma venda num dia que já passou, um campo opcional para
  a hora. Sem hora, ela continua "sem horário", como hoje.
- **O cursor volta sozinho para a busca do estoque** depois de registrar, depois de clicar num "mais vendido" e
  ao abrir o app (só no notebook). Robô: 10% menos cliques e 12% menos rolagens, sem nenhuma ação a mais.
- **Atalho na área de trabalho que abre o app numa janela própria** (sem abas e sem barra de endereço). Robô:
  21% menos rolagens só pelo espaço a mais na tela. O arquivo do app precisa ficar sempre com o mesmo nome.
- **"+" no teclado = mais uma unidade do último produto** (com a busca do estoque vazia), no lugar de clicar no
  "+" pequeno com o touchpad.
- **Gasto que se repete todo mês vira "gasto fixo" com um clique.** Só quando houver dois meses de dados, para
  saber o que se repete.

## Esperam mais dados ou resposta da contadora

- **Conferir as vendas com o relatório do Mercado Pago.** O app lê a planilha baixada do site do Mercado Pago (sem
  internet no app) e mostra o que está no Mercado Pago e não foi lançado, o que foi lançado como cartão ou Pix e não
  está lá, e a taxa de verdade da maquininha. Nada é lançado sem clique. Precisa de um relatório de exemplo.
- **Ler a nota (XML) do fornecedor na "Chegou mercadoria".** Só se o fornecedor mandar o arquivo da nota; hoje é
  mais ou menos uma compra por mês.
- **Nota fiscal (NFC-e de produto, NFS-e de serviço).** O app não emite nota: precisa de internet, certificado
  digital e um emissor autorizado. Depende do que a contadora disser que a loja precisa.
- **Maquininha integrada** (o valor da venda vai sozinho para a maquininha do Mercado Pago). Precisa de internet,
  da maquininha certa e de um programa "ponte" para guardar a senha de acesso; muda o jeito do app.

## Não passaram no filtro (análise dos outros sistemas, 22/10/2026)

- Ligação automática com o Mercado Pago pela internet: a senha de acesso tem que ficar num servidor, e o app é um
  arquivo que funciona sem internet. A conferência pela planilha dá o mesmo resultado sem esse risco.
- Inteligência artificial dentro do app: precisa de internet, tem custo e os dados sairiam do notebook. Já existem
  sugestões feitas pelo próprio app (categoria do gasto, mais vendidos, comprar), e a análise dos backups é feita
  na conversa.
- Guardar o segredo da chave de cada cliente: arriscado se o notebook for perdido ou roubado (não há senha).
- Leitor de código de barras e etiquetas: chave virgem não tem código; a busca é pelo modelo.
- Orçamento, agenda e ordem de serviço completos: "Encomendas e serviços pendentes" já existe e quase não é usado.
- Cadastro de clientes, fidelidade, comissão de vendedor e login por pessoa: sem sinal de necessidade nos dados.
- Boletos e cobrança: não há fiado no período.
- DRE e conciliação contábil: é trabalho da contadora; o app não inventa contabilidade.
- App de celular, loja online e WhatsApp: fora do jeito que a loja usa o app.
- Backup automático na nuvem: precisa de internet; o backup e o arquivo de dados já existem.
- Estoque separado do carro de serviço: sem dados.

## Testadas e deixadas de fora (medidas com o robô, não refazer)

- Barra flutuante com "Registrar" no notebook: nenhuma rolagem a menos.
- Voltar ao começo da tela depois de cada venda: piorou (mais rolagens).
- "Mais vendidos" logo abaixo da busca principal: ganho menor que a ordem escolhida.
- Tela que sobe sozinha enquanto se digita na busca do estoque: ganho pequeno (2% menos rolagens) e a tela
  andaria sozinha, o que confunde.
- Bloco "Serviços" logo depois de "Outros" e já aberto: nenhuma rolagem a menos.
- Aviso do topo ("Seus dados estão só no navegador") escondido: nenhuma rolagem a menos.
- Botões de "mais usados" para serviços: cada serviço é diferente, quase não se repetem; não ajudariam.
- 10 "Mais vendidos" em vez de 6: um pouco menos de ações, mas 20% mais rolagens.

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
- Conferir os gastos do mês numa lista, com um clique por gasto, e categoria "Impostos": não escolhida em 22/10.
- Não escolhidas em 22/10: serviços novos "Confecção de chave" e "Manutenção / conserto"; "o que foi?" no
  "Outros" sem descrição; sugestão de categoria do gasto mais esperta; ajuste de estoque anotado num histórico;
  lembrete de "Chegou mercadoria" ao lançar gasto de mercadoria.
