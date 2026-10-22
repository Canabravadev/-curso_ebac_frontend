---
name: chaveiro-laboratorio
description: Método para criar ideias novas para o app Chaveiro ("criar como criança, editar como cientista") e para tirar conclusões com os dados reais da loja. Use quando pedirem ideias, melhorias ou "o que mais dá para fazer", quando chegar um arquivo de dados ou backup novo, ou antes de afirmar qualquer coisa sobre como a loja usa o app.
---

# Laboratório de ideias

## Dados reais
- Chegam como arquivo enviado na conversa (backup JSON do app). Use sempre o **mais novo**: compare o `savedAt`
  dos arquivos antes de concluir qualquer coisa. Uma conclusão tirada de arquivo velho já causou erro
  (o controle clonável, que voltou a ser como era).
- Nunca copie dados reais nem números deles para o repositório. Trabalhe numa pasta temporária e nunca altere
  o arquivo enviado: confira o sha256 antes e depois.

## Criança (gerar)
- Pense muitas ideias sem filtro: balcão, estoque, gastos, fiado, Resumo, Excel, segurança dos dados, rapidez.
- Boas fontes nos dados: o que mais se digita em "Outros", o que é corrigido ou apagado, o que nunca é usado,
  vendas com a conta errada.

## Cientista (filtrar)
Uma ideia só passa se cumprir tudo:
1. Tem prova nos dados reais mais novos: quantas vezes acontece e quanto tempo ou dinheiro está em jogo.
   Amostra pequena não vira conclusão; diga "poucos dados ainda".
2. Tem ganho medido. Para trabalho no balcão, `node chaveiro/laboratorio/robo_caixa.js dados.json [app.html]`
   refaz as vendas pela tela do notebook e conta toques e letras. Rode antes e depois e compare o TOTAL.
3. Não arrisca dado salvo e continua compatível com backups antigos.
4. Não está recusada em `chaveiro/IDEIAS.md` e não existe já no app (procure no HTML).
5. Não é ideia de celular (o app é usado no notebook) e não redesenha o visual.
6. Dá para testar automaticamente (veja a skill chaveiro-testes).

## Apresentar
- Nunca implemente antes da aprovação. Mostre só as ideias que passaram, numeradas. Para cada uma: o que muda na
  tela, a prova (números dos dados), o ganho e o risco. Escreva em português simples.
- Guarde em `chaveiro/IDEIAS.md`, sem números reais: as aprovadas que esperam a vez, as que esperam mais dados
  e as recusadas.
- As decisões já tomadas por quem usa o app estão no CLAUDE.md, na seção "Balcão". Não reabra essas decisões.
