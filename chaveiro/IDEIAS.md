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
- **O cursor volta sozinho para a busca do estoque** ao abrir o app, depois de registrar e depois de clicar num
  "mais vendido" (só no notebook). "/" continua indo para a busca do histórico. Robô: 10% menos cliques e cerca de
  10% menos rolagens.
- **Tecla "+" = mais uma unidade do último produto do estoque** posto na venda, com a busca vazia. A busca lembra:
  "outro modelo, ou + para mais um". O controle clonável continua travando quando acaba. Robô, junto com o cursor:
  19% menos cliques no touchpad (o "+" troca clique por tecla; as rolagens ficam quase iguais).
- **"Que horas foi?" na venda lançada depois.** Num dia que já passou, um botão opcional para pôr a hora da venda.
  Sem hora, ela fica "sem horário", como antes; "Sem horário" tira a hora digitada. Hoje continua "Vendeu mais cedo?".
- **Atalho na área de trabalho** (Ajustes → "Baixar atalho"): abre o app no Chrome numa janela própria, sem abas e
  sem barra de endereço. O arquivo do app precisa ficar sempre no mesmo lugar e com o mesmo nome. Robô: cerca de
  20% menos rolagens que na janela normal do Chrome.

## Aprovadas, esperando a vez (22/10/2026)

- **"Outros" levando ao item certo.** Os botões "Mais usados em Outros" de chaveiro e chaverinho lançam no item
  Chaveiro, com o mesmo clique. O aviso "Já existe… usar esse item" passa a reconhecer manutenção, solda,
  elétrica, confecção, troca de miolo e abertura de fechadura; "Fiorino" (nome de carro) vira abertura de carro,
  não de porta. Continua só sugerindo. Antes de fazer: perguntar à contadora se ela precisa separar serviço de
  produto.
- **Gasto que se repete todo mês vira "gasto fixo" com um clique.** Só quando houver dois meses de dados, para
  saber o que se repete.
- **Mercado Pago: vendas e saídas automáticas.** O app busca no Mercado Pago (pela internet) as vendas de cartão e
  Pix e o dinheiro que saiu da conta, e mostra: o que entrou e não foi lançado, o que foi lançado como cartão ou Pix
  e não aparece lá, a taxa de verdade da maquininha e as compras pagas pela conta. Lançar o que falta é um clique;
  nada entra sozinho.
- **Maquininha integrada (Point do Mercado Pago em modo PDV).** O app manda o valor para a maquininha, o cliente
  paga no cartão ou no Pix, e a forma de pagamento (débito, crédito ou Pix) volta sozinha para a venda. Sem
  internet, continua do jeito de hoje (digitar na maquininha). Falta saber o modelo da maquininha.
- Para essas duas: uma "ponte" na internet guarda a senha de acesso do Mercado Pago (o Mercado Pago exige que ela
  fique fora do navegador). A senha nunca fica no app nem no backup.
- **Backup automático todo dia no Google Drive de vocês**, pela mesma ponte. Hoje o backup depende de clicar
  quando o app avisa, e as cópias automáticas ficam no próprio notebook.

## Esperam mais dados ou resposta da contadora

- **Ler a nota (XML) do fornecedor na "Chegou mercadoria".** Só se o fornecedor mandar o arquivo da nota; hoje é
  mais ou menos uma compra por mês.
- **Nota fiscal (NFC-e de produto, NFS-e de serviço) emitida pelo app**, por um serviço de notas ligado à ponte
  (precisa de certificado digital e tem custo por nota). Depende do que a contadora disser que a loja precisa; para
  serviço, o Emissor Nacional do governo é grátis.

## Não passaram no filtro (análise dos outros sistemas, 22/10/2026)

Sistemas olhados: GestãoClick, BomSaldo, Simples Agenda, PDV Smart, vhsys, eGestor, Bling, Omie, Olist Tiny,
Nuvemshop PDV, Mais PDV, InfinitePay, MarketUP, Loyverse, Hiper, TagPlus, Conta Azul, Awise, Gratis POS e KeyBolt.

- Inteligência artificial dentro do app (perguntas, classificar lançamentos, ler foto de nota): tem custo, os dados
  sairiam para outra empresa e nada nos dados pede isso. A análise mensal dos backups é feita na conversa.
- Guardar o segredo da chave de cada cliente: arriscado se o notebook for perdido ou roubado.
- Leitor de código de barras, etiquetas e impressora: chave virgem não tem código; a busca é pelo modelo.
- Orçamento com link, agenda com lembretes e ordem de serviço completa: "Encomendas e serviços pendentes" já existe
  e quase não é usado.
- Cadastro de clientes, fidelidade, comissão, permissões e ponto de funcionário: sem sinal de necessidade nos dados.
- Boletos, carnês, link de pagamento e cobrança automática: não há fiado no período.
- Contratos e cobrança recorrente: sem clientes de contrato nos dados.
- Abertura, sangria e fechamento de caixa: "Conferir o caixa do dia" foi retirado a pedido.
- DRE, plano de contas e conciliação contábil: é trabalho da contadora; o app não inventa contabilidade.
- Contadora vendo tudo em tempo real: perto do "Aviso para a contadora", recusado; ela recebe o Excel.
- Pix com QR na tela do app: recusado; com a maquininha integrada, o Pix é pago na maquininha.
- Várias lojas, loja online, marketplaces, app de celular e WhatsApp: fora do jeito que a loja trabalha.
- Estoque separado do carro de serviço: sem dados.
- Avisos por SMS, WhatsApp ou e-mail: o WhatsApp foi tirado e não há fiado para cobrar.
- Validade e lote de produto: não se aplica a chave e bateria do jeito que a loja vende.
- Lista de preço de atacado: sem vendas para empresas nos dados.
- Já existiam no app (nada a fazer): vender sem internet, troca e devolução, serviço com peça na mesma venda,
  contador de chaves cortadas, estoque mínimo e lista de compras, relatórios, esconder o faturamento.

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
- Conferir as vendas pela planilha baixada do Mercado Pago: não escolhida (a preferida é a ligação automática).
- Não escolhidas em 22/10 (ideias tiradas dos outros sistemas): estoque de cadeados, chaveirinhos, miolos e
  fechaduras escolhidos no item rápido; histórico de alterações das vendas; quem fez o serviço / pagamento de
  ajudante.
