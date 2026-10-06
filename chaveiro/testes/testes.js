// Testes do app no navegador (Playwright + Chromium), com relógio fixo e dados de exemplo.
// Uso: node chaveiro/testes/testes.js   (ou ./chaveiro/testes/rodar.sh, que também confere o Excel)
'use strict';
const fs = require('fs'), path = require('path'), os = require('os'), { execFileSync } = require('child_process');
let pw; try { pw = require('playwright'); } catch (e) { pw = require('/opt/node-tools/node_modules/playwright'); }
const { gerar } = require('./dados');

const APP = 'file://' + path.resolve(__dirname, '..', 'Chaveiro_Vendas_e_Gastos.html');
const AGORA = '2026-10-20T15:00:00';
const TMP = fs.mkdtempSync(path.join(os.tmpdir(), 'chaveiro-testes-'));
const CHROMIUM = process.env.CHROMIUM || (fs.existsSync('/opt/pw-browsers/chromium') ? '/opt/pw-browsers/chromium' : undefined);
const K = { vendas: 'chaveiro_vendas_v2', despesas: 'chaveiro_despesas_v1', estoque: 'chaveiro_estoque_v1', meta: 'chaveiro_meta_v1', extras: 'chaveiro_extras_v1' };

let nOk = 0, nF = 0;
function ok(c, msg) { if (c) { nOk++; console.log('  OK   ' + msg); } else { nF++; console.log('  FALHA ' + msg); } }
const norm = s => String(s || '').replace(/\s+/g, ' ').trim();

async function abre(b, dados, agora) {
  const ctx = await b.newContext({ viewport: { width: 1366, height: 900 }, acceptDownloads: true });
  await ctx.clock.install({ time: new Date(agora || AGORA) });
  const p = await ctx.newPage(), errs = [];
  p.on('pageerror', e => errs.push(e.message)); p.on('dialog', d => d.accept());
  await p.goto(APP);
  await p.evaluate(({ d, K }) => {
    localStorage.clear();
    ['vendas', 'despesas', 'estoque'].forEach(k => localStorage.setItem(K[k], JSON.stringify(d[k] || [])));
    if (d.meta) localStorage.setItem(K.meta, String(d.meta));
    if (d.extras) localStorage.setItem(K.extras, JSON.stringify(d.extras));
  }, { d: dados, K });
  await p.reload(); await p.waitForSelector('#registrarBtn'); await p.waitForTimeout(150);
  return { ctx, p, errs };
}
const lsJ = async (p, k) => JSON.parse(await p.evaluate(k => localStorage.getItem(k), k) || 'null');
const ultima = async p => { const vs = await lsJ(p, K.vendas); return vs[vs.length - 1]; };

(async () => {
  const b = await pw.chromium.launch({ executablePath: CHROMIUM });
  const D = gerar();

  console.log('Abertura');
  let { ctx, p, errs } = await abre(b, D);
  for (const t of ['vendas', 'estoque', 'despesas', 'resumo']) { await p.click(`[data-tab="${t}"]`); await p.waitForTimeout(120); }
  ok(errs.length === 0, 'as quatro abas abrem sem erro de JavaScript ' + errs.join(' | '));
  ok((await lsJ(p, K.vendas)).length === D.vendas.length, 'nenhuma venda some ao abrir');
  await p.click('[data-tab="vendas"]');

  console.log('Venda do estoque');
  const p2 = D.estoque.find(x => x.id === 'p2');
  await p.fill('[data-stock-box="0"]', p2.modelo); await p.waitForTimeout(80);
  await p.click('#stockResults-0 [data-pid="p2"]');
  await p.click('.pay-btn[data-pay="pix"]'); await p.click('#registrarBtn'); await p.waitForTimeout(200);
  let v = await ultima(p);
  ok(v.items.length === 1 && v.items[0].pid === 'p2' && v.total === p2.preco && v.pay === 'pix', 'venda registrada com o produto e o preço do estoque');
  ok((await lsJ(p, K.estoque)).find(x => x.id === 'p2').qty === p2.qty - 1, `estoque desconta 1 (${p2.qty} → ${p2.qty - 1})`);

  console.log('Pagamento dividido');
  await p.click('.step-btn.plus[data-cat="carro"]'); await p.fill('[data-price-cat="carro"]', '100');
  await p.click('#splitToggle'); await p.waitForTimeout(80);
  for (const f of ['dinheiro', 'pix', 'cartao']) await p.fill(`[data-split="${f}"]`, '');
  await p.fill('[data-split="pix"]', '30'); await p.waitForTimeout(50);
  ok(await p.isDisabled('#registrarBtn'), 'não registra enquanto as partes não fecham o total');
  await p.click('[data-resto="dinheiro"]'); await p.waitForTimeout(50);
  await p.click('#registrarBtn'); await p.waitForTimeout(200);
  v = await ultima(p);
  ok(v.total === 100 && v.pay === 'dinheiro' && JSON.stringify(v.split) === JSON.stringify([{ pay: 'dinheiro', valor: 70 }, { pay: 'pix', valor: 30 }]), 'partes salvas e a forma principal é a maior parte');

  console.log('Fiado');
  await p.click('.step-btn.plus[data-cat="carro"]'); await p.fill('[data-price-cat="carro"]', '40');
  await p.click('.pay-btn[data-pay="fiado"]'); await p.fill('#clienteInput', 'Cliente Teste A'); await p.waitForTimeout(80);
  ok(/já deve/.test(norm(await p.textContent('#fiadoHint'))), 'avisa que o cliente já deve');
  await p.click('#registrarBtn'); await p.waitForTimeout(200);
  v = await ultima(p); ok(v.pay === 'fiado' && v.cliente === 'Cliente Teste A' && v.total === 40, 'fiado registrado com o nome');

  console.log('Gasto');
  await p.click('[data-tab="despesas"]'); await p.fill('#expDesc', 'café'); await p.selectOption('#expCat', 'outros'); await p.fill('#expValor', '12,50');
  await p.click('#registrarGastoBtn'); await p.waitForTimeout(200);
  const g = (await lsJ(p, K.despesas)).find(e => e.desc === 'café'); ok(g && g.valor === 12.5 && g.day === '2026-10-20', 'gasto salvo com valor e data de hoje');

  console.log('Persistência');
  const antes = await p.evaluate(K => Object.values(K).map(k => localStorage.getItem(k)), K);
  await p.reload(); await p.waitForSelector('#registrarBtn'); await p.waitForTimeout(150);
  ok(JSON.stringify(antes) === JSON.stringify(await p.evaluate(K => Object.values(K).map(k => localStorage.getItem(k)), K)), 'recarregar a página não altera nada salvo');
  ok(errs.length === 0, 'sem erros de JavaScript ' + errs.join(' | '));

  console.log('Backup e restauração');
  await p.click('[data-tab="resumo"]');
  const [dl] = await Promise.all([p.waitForEvent('download'), p.click('#backupBtn')]);
  const bkPath = path.join(TMP, 'backup.json'); await dl.saveAs(bkPath);
  const bk = JSON.parse(fs.readFileSync(bkPath, 'utf8'));
  const vendasAgora = await lsJ(p, K.vendas), estoqueAgora = await lsJ(p, K.estoque), extrasAgora = await lsJ(p, K.extras);
  ok(bk.vendas.length === vendasAgora.length && bk.estoque.length === estoqueAgora.length && bk.extras && bk.extras.retrabalhos.length === 1, 'backup leva vendas, estoque e extras');
  await ctx.close();
  ({ ctx, p, errs } = await abre(b, { vendas: [], despesas: [], estoque: [] }));
  await p.click('[data-tab="resumo"]'); await p.setInputFiles('#restoreFile', bkPath); await p.waitForTimeout(300);
  ok(JSON.stringify(await lsJ(p, K.vendas)) === JSON.stringify(vendasAgora), 'restaurar num navegador vazio traz as vendas idênticas');
  const porId = l => JSON.stringify(l.slice().sort((x, y) => x.id < y.id ? -1 : 1)); // a ordem pode mudar, o conteúdo não
  ok(porId(await lsJ(p, K.estoque)) === porId(estoqueAgora), 'e o estoque idêntico');
  const ex = await lsJ(p, K.extras); ok(ex && ex.fixos.length === extrasAgora.fixos.length && ex.encomendas.length === 1 && ex.cfg.taxas.credito === 3.5, 'e os extras (ajustes, fixos, encomendas)');
  await p.setInputFiles('#restoreFile', bkPath); await p.waitForTimeout(300);
  ok((await lsJ(p, K.vendas)).length === vendasAgora.length, 'restaurar o mesmo backup de novo não duplica nada');
  ok(errs.length === 0, 'sem erros de JavaScript ' + errs.join(' | '));
  await ctx.close();

  console.log('Dados antigos (sem extras)');
  ({ ctx, p, errs } = await abre(b, { vendas: D.vendas.slice(0, 20), despesas: [], estoque: D.estoque }));
  for (const t of ['vendas', 'estoque', 'despesas', 'resumo']) { await p.click(`[data-tab="${t}"]`); await p.waitForTimeout(100); }
  ok(errs.length === 0 && await p.evaluate(k => localStorage.getItem(k), K.extras) === null, 'abre sem erro e não cria extras à toa');
  await ctx.close();

  console.log('Excel da contadora (outubro)');
  ({ ctx, p, errs } = await abre(b, D));
  await p.click('[data-tab="resumo"]');
  const foto = () => p.evaluate(() => JSON.stringify(Object.keys(localStorage).sort().map(k => [k, localStorage.getItem(k)])));
  const f0 = await foto();
  const [x] = await Promise.all([p.waitForEvent('download'), p.click('#exportXlsx')]);
  const xlsx = path.join(TMP, x.suggestedFilename()); await x.saveAs(xlsx); await p.waitForTimeout(150);
  ok(/2026-10\.xlsx$/.test(x.suggestedFilename()), 'arquivo com o mês no nome: ' + x.suggestedFilename());
  ok(f0 === await foto(), 'exportar não altera nenhum dado salvo');
  ok(errs.length === 0, 'sem erros de JavaScript ' + errs.join(' | '));
  await ctx.close(); await b.close();
  const cen = path.join(TMP, 'cenario.json'); fs.writeFileSync(cen, JSON.stringify(D));
  try {
    const r = JSON.parse(execFileSync('python3', [path.join(__dirname, 'confere_excel.py'), xlsx, cen, '2026-10', AGORA], { encoding: 'utf8' }).trim().split('\n').pop());
    ok(r.falhas === 0, `planilha conferida contra os dados (${r.ok} verificações, ${r.falhas} falhas)`);
  } catch (e) { ok(false, 'conferência da planilha: ' + String(e.stdout || e.message).slice(0, 600)); }

  console.log(`\n${nOk} OK, ${nF} FALHAS`);
  if (process.env.MANTER) console.log('arquivos em ' + TMP); else fs.rmSync(TMP, { recursive: true, force: true });
  process.exit(nF ? 1 : 0);
})().catch(e => { console.error(e); process.exit(1); });
