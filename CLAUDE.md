# Chaveiro — Vendas e Gastos

App de um arquivo só (`chaveiro/Chaveiro_Vendas_e_Gastos.html`) usado no balcão de uma loja de chaves:
registra vendas (estoque, chaves, serviços, "Outros"), estoque, gastos, fiado, encomendas e
retrabalhos, mostra o resumo do mês e gera o Excel mensal da contadora. Funciona offline,
direto do arquivo, no Chrome. É usado todo dia, no notebook, por duas pessoas (quem pede as mudanças e o pai),
no mesmo usuário e no mesmo Chrome, então os dados são os mesmos: estabilidade vem antes de novidade.

## Regras
- Nunca perder, alterar ou duplicar dados salvos. Manter compatível com dados e backups antigos
  (chaves do localStorage, formato das vendas, IDs, backup/restauração, sincronização com arquivo).
- Nunca inventar informação (nem no app, nem no Excel). O Excel é só leitura dos dados: 7 abas
  (Resumo, Vendas, Itens das vendas, Gastos, Pagamentos, Fiado, Recebimentos), sem estoque,
  sem conferências internas, sem contabilidade inventada.
- Não redesenhar o visual existente. Componentes novos usam as peças que já existem
  (`.field-wrap`, `.money-input`, `.registrar-btn`, `.est-btn`, `.pay-btn`, `.pill`, `.tag`, `details.card`...).
- JavaScript ES5 dentro de uma IIFE, sem bibliotecas externas. Nada é carregado da internet:
  as fontes (Fraunces, IBM Plex Sans, JetBrains Mono, só latim) e o ícone estão embutidos no arquivo.
- Internet liberada por quem usa o app (22/10/2026), só para integrações aprovadas (Mercado Pago, backup) e
  sempre como extra: abrir, vender, salvar e fazer backup continuam funcionando sem internet. Senhas de acesso
  (ex.: Mercado Pago) nunca ficam no app, no localStorage nem no backup; ficam numa "ponte" fora do navegador.
- Alvo: Chrome atualizado no notebook (Linux Mint, tela 1366×768, tema escuro), usado com touchpad. Não propor
  ideias focadas em celular (iPhone não é usado).
- Ideia nova só entra depois de aprovada: apresentar antes de fazer. As que passaram no filtro, as que esperam
  mais dados e as recusadas ficam em `chaveiro/IDEIAS.md` (sem números reais da loja).
- Erro encontrado pode ser corrigido sem perguntar, com teste que o pegue; depois, contar qual era o erro e por
  que acontecia.
- Depois que os testes passam, o trabalho é juntado na `main` (pull request e merge; quem usa o app deixou essa
  decisão comigo). Trabalho novo recomeça a branch de trabalho a partir da `main`.
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

## Balcão (decisões baseadas nos dados reais)
- Controle clonável é o produto do estoque (Controle de portão / Controle clonavel): baixa do estoque e trava
  quando acaba. Não mudar (decisão de quem usa o app).
- Miolo, Cadeado e Chaveiro são itens rápidos de valor livre com "Qual?" opcional (eram 8 de 19 "Outros").
  Em "Outros", uma descrição que já tem item próprio (serviço, miolo, cadeado, chaveiro) sugere trocar; só sugere.
- Gasto da categoria `pessoal` (Pessoal / da casa) fica fora do saldo e do resultado da loja (app, resumo do dia,
  retrato do ano, CSV e Excel). A aba Gastos do Excel lista todos; o Resumo mostra loja e pessoal separados.
  Sem gasto pessoal no mês, o Excel sai idêntico ao de antes. Nenhum gasto muda de categoria sozinho.
- A categoria do gasto é sugerida pela descrição (memória dos gastos já lançados, depois palavras óbvias).
- "Conferir o caixa do dia" foi retirado (pedido de quem usa o app).
- As opções de WhatsApp foram tiradas (não eram usadas); "Copiar lista" continua no Estoque. Textos dizem "clique",
  não "toque" (notebook).
- Tela de Vendas, de cima para baixo: busca do estoque, mais vendidos, "Outros", itens rápidos (ordem medida com o
  robô no notebook: 32% menos rolagens). Depois de registrar, a tela não volta ao topo (medido: piora).
- Comparação do dia no topo: hoje compara só até a mesma hora da semana anterior (dia inteiro na dica do mouse,
  escondida junto com os valores); venda "sem horário" (lançada depois) não tem hora conhecida, então fica fora do
  "até esta hora" e aparece à parte na mesma linha ("+ R$ X sem horário"); dias que já passaram comparam o dia inteiro.
- O app é aberto direto do arquivo no Chrome; o backup ("Salvar backup") é feito quando o app avisa.
- A maquininha é a Point do Mercado Pago (Mercado Pago/Mercado Livre); cartão e Pix passam por ela. A ligação
  automática com o Mercado Pago e a maquininha integrada foram aprovadas (ver `chaveiro/IDEIAS.md`).
- Serviços têm "Qual?" opcional; em Outros, "instalação/retirada/buscar…" sugere "Outro serviço" (descrição inteira).
- Resumo: venda com a conta errada (itens/desconto/total não fecham) aparece com "Abrir e corrigir" (nunca corrige
  sozinho); "Vendas do mês" em ordem de valor; "Outros" abre o detalhe por descrição.
- Gasto pode ser dividido ("Separar uma parte"): a parte vira gasto novo no mesmo dia e a soma não muda.
- Venda nova de hoje pode ter a hora ajustada ("Vendeu mais cedo?") quando é lançada depois; nunca no futuro.
  Num dia que já passou, "Que horas foi? (opcional)": sem hora, a venda continua "sem horário" (`manual`).
- O cursor volta sozinho para a busca do estoque (ao abrir, depois de registrar e depois de um "mais vendido"; só
  com tela larga). Com a busca vazia, "+" põe mais uma unidade do último produto do estoque (o clonável trava igual
  ao botão) e "/" continua indo para a busca do histórico.
- Ajustes tem "Baixar atalho": um `Chaveiro.desktop` (Linux Mint) que abre o arquivo no Chrome em janela própria
  (`--app`), sem abas nem barra de endereço. O arquivo do app precisa continuar no mesmo lugar e com o mesmo nome.

## Testes
`./chaveiro/testes/rodar.sh` — abre o app no Chromium com relógio fixo (20/10/2026) e dados de
exemplo: venda do estoque, pagamento dividido, fiado, gasto, persistência, backup/restauração,
valores mais cobrados, venda em andamento que volta ao recarregar, apagados recentemente, cópias automáticas, comparação com o mês passado, tamanho do
texto, aviso ao sair com venda pela metade, enviar backup/Excel e tela acesa (Android simulado), funcionar sem internet, itens rápidos e sugestão de item, gasto pessoal e categoria sugerida, serviço com "Qual?", Outros detalhado, ordem por valor, conta errada, dividir gasto, contraste do calendário escuro, cursor na busca, tecla "+", "Que horas foi?", atalho da área de trabalho, dados antigos e o Excel (conferido por `confere_excel.py`, que recalcula tudo a partir dos dados,
e aberto pelo LibreOffice e pelo validador oficial da Microsoft em `valida_excel.py`). Depois roda `lint.js` (ESLint: só ES5
mais async/await, nada indefinido, recursos do Chrome do notebook) e `acessibilidade.js` (axe-core em 18 telas, claro e escuro).
Rode antes de cada commit. `MANTER=1` guarda os arquivos gerados.
As ferramentas extras (ESLint, axe-core, LibreOffice, .NET com o validador) são instaladas, com versões fixas, por
`.claude/hooks/session-start.sh`, que roda sozinho no começo de cada sessão na nuvem; sem elas, essas partes aparecem como PULADO.
Skills do projeto em `.claude/skills/`: chaveiro-testes, chaveiro-excel, chaveiro-laboratorio e chaveiro-entrega.
`chaveiro/laboratorio/robo_caixa.js` refaz vendas de um backup pela tela do notebook e conta toques e letras (para medir ideias).
`COMPLETO=1 ./chaveiro/testes/rodar.sh` também roda `caos.js` (robô com ações aleatórias e vendas completas,
conferindo as regras dos dados a cada ação) e `backup_estragado.js` (restaura backups corrompidos: nada local
pode sumir, mudar ou duplicar). Rode o completo antes de mexer em gravação, backup ou restauração.
