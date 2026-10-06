# Conferência do Excel da contadora (7 abas) contra os dados de origem, calculada aqui sem usar o app.
# Uso: python3 confere_excel.py arquivo.xlsx cenario.json AAAA-MM agoraISO
import sys, json, datetime as dt, openpyxl, zipfile, re
arq, cen, mes, agora = sys.argv[1:5]
D = json.load(open(cen)); ag = dt.datetime.fromisoformat(agora); hoje = ag.date().isoformat()
f = openpyxl.load_workbook(arq); c = openpyxl.load_workbook(arq, data_only=True)
ok = 0; falhas = []
def chk(cond, msg):
    global ok
    if cond: ok += 1
    else: falhas.append(msg)
ABAS = ['Resumo','Vendas','Itens das vendas','Gastos','Pagamentos','Fiado','Recebimentos']
chk(f.sheetnames == ABAS, f'abas {f.sheetnames}')
HDR = {'Vendas':['Data','Hora','ID da venda','Cliente','Itens','Subtotal','Desconto','Total','Forma de pagamento'],
 'Itens das vendas':['Data','Hora','ID da venda','Cliente','Produto / Serviço','Categoria','Quantidade','Valor unitário','Total do item','Forma de pagamento'],
 'Gastos':['Data','Hora','Descrição','Categoria','Valor','Observação'],
 'Pagamentos':['Forma de pagamento','Quantidade de vendas','Valor total','Percentual do total'],
 'Fiado':['ID da venda','Data da venda','Cliente','Valor original','Valor recebido','Saldo','Status'],
 'Recebimentos':['Data do recebimento','Hora','ID da venda','Data da venda','Cliente','Forma de pagamento','Valor recebido','Observação']}
# ---- esperado, calculado direto do JSON (independente do app) ----
r2 = lambda x: round(x + 1e-9, 2)
V = sorted([v for v in D['vendas'] if v['day'][:7] == mes], key=lambda v: (v['day'], v.get('ts', 0)))
G = [e for e in D['despesas'] if e['day'][:7] == mes]
recs = lambda v: [r for r in (v.get('recebimentos') or []) if isinstance(r, dict) and re.match(r'^\d{4}-\d\d-\d\d$', str(r.get('day',''))) and isinstance(r.get('valor'), (int,float))]
rec = lambda v: r2(sum(r['valor'] for r in recs(v)))
saldo = lambda v: r2(max(0, v['total'] - rec(v))) if v.get('pay') == 'fiado' else 0
FI = [v for v in V if v.get('pay') == 'fiado']
RC = [(v, r) for v in D['vendas'] for r in recs(v) if r['day'][:7] == mes]
liq = r2(sum(v['total'] for v in V)); totG = r2(sum(e['valor'] for e in G))
PN = {'dinheiro':'Dinheiro','pix':'Pix','cartao':'Cartão','fiado':'Fiado'}
pn = lambda p: PN.get(p, p if p else 'Não informado')
# pagamento dividido: cada parte conta na sua forma, pelo valor pago nela
def partes(v):
    sp = v.get('split')
    if isinstance(sp, list) and len(sp) > 1 and all(isinstance(x, dict) and isinstance(x.get('valor'), (int, float)) for x in sp): return [(x['pay'], x['valor']) for x in sp]
    return [(v.get('pay'), v['total'])]
brl = lambda x: 'R$\xa0' + f'{x:,.2f}'.replace(',', '_').replace('.', ',').replace('_', '.')
paytxt = lambda v: ' + '.join(f'{pn(p)} {brl(x)}' for p, x in partes(v)) if len(partes(v)) > 1 else pn(v.get('pay'))
# ---- verificações por aba ----
proib = re.compile(r'estoque|confer[eê]ncia|diverg|inconsist|aviso|m[ií]nimo|⚠|ID do produto|sistema|vers[aã]o antiga|registro antigo|quarentena', re.I)
livres = {('Vendas','E'), ('Itens das vendas','E')}  # descrições digitadas pelo usuário (texto real das vendas)
for ws in f:
    for row in ws.iter_rows():
        for cell in row:
            v = cell.value
            if isinstance(v, str) and (ws.title, cell.column_letter) not in livres and proib.search(v):
                chk(False, f'texto técnico/estoque em {ws.title}!{cell.coordinate}: {v[:80]}')
for nome, hs in HDR.items():
    ws = f[nome]; cs = c[nome]
    vazio = ws['A4'].value != hs[0]
    n = {'Vendas':len(V),'Itens das vendas':sum(len(v['items']) for v in V),'Gastos':len(G),'Fiado':len(FI),'Recebimentos':len(RC),
         'Pagamentos':len({pn(p) for v in V for p, _ in partes(v)})}[nome]
    if n == 0: chk(vazio and isinstance(ws['A4'].value, str) and ws['A4'].value.startswith('Nenhum'), f'{nome}: vazio sem mensagem'); continue
    chk([ws.cell(4, i+1).value for i in range(len(hs))] == hs, f'{nome}: cabeçalho {[ws.cell(4,i+1).value for i in range(len(hs))]}')
    chk(ws.cell(4, len(hs)+1).value is None, f'{nome}: coluna extra')
    t = list(ws.tables.values()); last = 4 + n
    chk(t and t[0].ref == f'A4:{openpyxl.utils.get_column_letter(len(hs))}{last}', f'{nome}: tabela {t and t[0].ref} esperado até {last}')
    chk(t and t[0].autoFilter is not None, f'{nome}: sem filtro')
    chk([col.name for col in t[0].tableColumns] == hs, f'{nome}: colunas da tabela')
    if nome != 'Pagamentos':
        chk(ws.freeze_panes == 'A5', f'{nome}: congelamento {ws.freeze_panes}')
        chk(f.defined_names is not None, 'nomes')
    chk(ws.page_setup.fitToWidth in (1, None) and ws.sheet_properties.pageSetUpPr.fitToPage, f'{nome}: impressão ajustada à largura')
    chk(str(ws.page_setup.fitToHeight) == '0', f'{nome}: fitToHeight')
    # tipos: datas/horas/valores como números
    for i, h in enumerate(hs):
        col = [cs.cell(r, i+1).value for r in range(5, last+1)]
        fmt = ws.cell(5, i+1).number_format
        if h.startswith('Data'): chk(all(isinstance(x, dt.datetime) for x in col) and fmt == 'dd/mm/yyyy', f'{nome}.{h}: datas {fmt}')
        if h == 'Hora': chk(all(x is None or isinstance(x, dt.time) for x in col) and fmt == 'hh:mm', f'{nome}.{h}: horas')
        if h in ('Subtotal','Desconto','Total','Valor','Valor total','Valor unitário','Total do item','Valor original','Valor recebido','Saldo'):
            chk(all(isinstance(x, (int, float)) for x in col) and 'R$' in fmt, f'{nome}.{h}: valores numéricos R$ ({fmt})')
        if h in ('Quantidade','Quantidade de vendas'): chk(all(isinstance(x, (int, float)) for x in col), f'{nome}.{h}: quantidades numéricas')
# títulos de impressão
wbx = zipfile.ZipFile(arq).read('xl/workbook.xml').decode()
for i, nome in enumerate(ABAS):
    if nome in ('Resumo','Pagamentos'): continue
    if f[nome]['A4'].value == HDR[nome][0]: chk(f'localSheetId="{i}">\'{nome}\'!$4:$4' in wbx, f'{nome}: cabeçalho repete na impressão')
chk(f['Resumo'].page_setup.orientation == 'portrait', 'Resumo retrato')
for nome in ('Vendas','Itens das vendas','Recebimentos'): chk(f[nome].page_setup.orientation == 'landscape', f'{nome} paisagem')
def _valores():
    global ok
    # ---- valores ----
    sv, sg, sf, sr, sp, si = c['Vendas'], c['Gastos'], c['Fiado'], c['Recebimentos'], c['Pagamentos'], c['Itens das vendas']
    if V:
        for j, v in enumerate(V):
            r = 5 + j
            chk([sv.cell(r, 3).value, sv.cell(r, 6).value, sv.cell(r, 7).value, sv.cell(r, 8).value, sv.cell(r, 9).value] == [v['id'], v['subtotal'], v['discount'], v['total'], paytxt(v)], f'venda {v["id"]} linha {r}')
            chk(sv.cell(r, 1).value.date().isoformat() == v['day'], f'data venda {v["id"]}')
            chk((sv.cell(r, 4).value or '') == (v.get('cliente') or ''), f'cliente {v["id"]}')
        n = len(V); chk(abs(sv.cell(5+n, 8).value - liq) < .005 and sv.cell(5+n, 1).value == 'Total', 'Vendas total')
        its = [(v, it) for v in V for it in v['items']]
        for j, (v, it) in enumerate(its):
            r = 5 + j; chk(si.cell(r, 3).value == v['id'] and si.cell(r, 7).value == it['qty'] and si.cell(r, 8).value == it['unitPrice'] and abs(si.cell(r, 9).value - r2(it['qty']*it['unitPrice'])) < .005, f'item {v["id"]} linha {r}')
            if it['cat'] == 'outros': chk(si.cell(r, 5).value == (it.get('desc') or 'Outros').strip() and si.cell(r, 6).value == 'Outros', f'Outros preserva descrição {r}')
    for j, e in enumerate(sorted(G, key=lambda e: (e['day'], e.get('ts', 0)))):
        r = 5 + j; chk(sg.cell(r, 3).value == e['desc'] and sg.cell(r, 5).value == e['valor'] and sg.cell(r, 1).value.date().isoformat() == e['day'], f'gasto linha {r}')
    for j, v in enumerate(FI):
        r = 5 + j; esp = 'Quitado' if rec(v) > 0 and saldo(v) <= 0 else 'Parcial' if rec(v) > 0 else 'Aberto'
        chk([sf.cell(r, k).value for k in (1, 3, 4, 5, 7)] == [v['id'], v.get('cliente', ''), v['total'], rec(v), esp] and abs(sf.cell(r, 6).value - saldo(v)) < .005, f'fiado {v["id"]}')
    RCs = sorted(RC, key=lambda x: (x[1]['day'], x[1].get('ts', 0)))
    for j, (v, rr) in enumerate(RCs):
        r = 5 + j
        chk(sr.cell(r, 1).value.date().isoformat() == rr['day'] and sr.cell(r, 4).value.date().isoformat() == v['day'] and sr.cell(r, 3).value == v['id'] and sr.cell(r, 7).value == rr['valor'] and sr.cell(r, 6).value == pn(rr['pay']), f'recebimento {rr.get("id")}')
    # Resumo
    rs = c['Resumo']; lab = {rs.cell(r, 1).value: r for r in range(1, rs.max_row+1) if rs.cell(r, 1).value}
    val = lambda k: rs.cell(lab[k], 2).value
    chk(rs['A1'].value == 'RELATÓRIO FINANCEIRO MENSAL', 'título')
    for k in ('PERÍODO','VENDAS','GASTOS','RESULTADO','PAGAMENTOS','FIADO'): chk(k in lab, f'seção {k}')
    chk(abs(val('Total bruto de vendas') - r2(sum(v['subtotal'] for v in V))) < .005, 'bruto')
    chk(abs(val('Total de descontos') - r2(sum(v['discount'] for v in V))) < .005, 'descontos')
    chk(abs(val('Total líquido de vendas') - liq) < .005, 'líquido')
    chk(val('Quantidade de vendas') == len(V), 'qtd vendas')
    chk(abs(val('Ticket médio') - (liq/len(V) if V else 0)) < .005, 'ticket')
    chk(abs(val('Total de gastos') - totG) < .005 and val('Quantidade de gastos') == len(G), 'gastos')
    DV = [r for r in ((D.get('extras') or {}).get('retrabalhos') or []) if r.get('tipo') == 'devolucao' and str(r.get('day', ''))[:7] == mes]
    totD = r2(sum(r.get('valor') or 0 for r in DV))
    kd = [k for k in lab if str(k).startswith('(−) Devoluções')]
    chk((len(kd) == 1 and abs(val(kd[0]) - totD) < .005 and f'({len(DV)})' in kd[0]) if DV else not kd, 'devoluções no resultado')
    chk(abs(val('(=) Resultado do período') - r2(liq - totG - totD)) < .005, 'resultado')
    chk(abs(val('Vendido no fiado no período') - r2(sum(v['total'] for v in FI))) < .005, 'fiado vendido')
    chk(abs(val('Recebido de fiado no período (pela data do recebimento)') - r2(sum(r['valor'] for _, r in RC))) < .005, 'fiado recebido')
    ks = [k for k in lab if str(k).startswith('Saldo em aberto')]
    chk(len(ks) == 1 and abs(val(ks[0]) - r2(sum(saldo(v) for v in FI))) < .005, 'saldo fiado')
    formas = {}
    for v in V:
        for p, x in partes(v): q, t = formas.get(pn(p), (0, 0)); formas[pn(p)] = (q+1, t+x)
    for nmf, (q, t) in formas.items():
        chk(nmf in lab and rs.cell(lab[nmf], 2).value == q and abs(rs.cell(lab[nmf], 3).value - t) < .005 and abs(rs.cell(lab[nmf], 4).value - t/liq) < 1e-6, f'Resumo forma {nmf}')
        pr = [r for r in range(5, 5+len(formas)) if sp.cell(r, 1).value == nmf]
        chk(pr and sp.cell(pr[0], 2).value == q and abs(sp.cell(pr[0], 3).value - t) < .005, f'Pagamentos {nmf}')
    chk(all(lab.get(k) is None for k in ('Dinheiro','Pix','Cartão','Fiado') if k not in formas), 'só formas usadas')
try: _valores()
except Exception as e: falhas.append(f"erro ao conferir valores: {e!r}")
print(json.dumps({'arquivo': arq.split('/')[-1], 'ok': ok, 'falhas': len(falhas)}, ensure_ascii=False))
for x in falhas[:40]: print('  FALHA', x)
