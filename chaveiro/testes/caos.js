// Teste do caos: um robô usa o app com ações aleatórias (semente fixa, dá para repetir) e vendas completas,
// e depois de cada ação confere as regras dos dados (sem duplicados, totais certos, nada inválido, sem erros).
// Uso: node chaveiro/testes/caos.js [semente] [ações] [largura da tela]
// Uso: node caos.js [semente] [acoes] [largura]
const path = require('path'); let pw; try { pw = require('playwright'); } catch (e) { pw = require('/opt/node-tools/node_modules/playwright'); } const { chromium } = pw;
const APP = 'file://' + path.resolve(__dirname, '..', 'Chaveiro_Vendas_e_Gastos.html'), CHROMIUM = process.env.CHROMIUM || (require('fs').existsSync('/opt/pw-browsers/chromium') ? '/opt/pw-browsers/chromium' : undefined);
const { gerar } = require('./dados');
const SEMENTE = +(process.argv[2] || 1), N = +(process.argv[3] || 600), LARG = +(process.argv[4] || 1366);
let seed = SEMENTE; const rnd = () => (seed = (seed * 16807) % 2147483647) / 2147483647; const pick = a => a[Math.floor(rnd() * a.length)];
const TEXTOS = ['', '0', '1', '12,5', '100', '1.234,56', '-5', '999999', 'abc', '  ', '0,01', '3', 'Cliente Teste A', 'Imobiliária Exemplo', '<b>x</b>', '"; drop', 'ção ñ 😀', '15/10/2026', '7', '20'];
function regras(dump) {
  const p = []; let V, G, E, X;
  try { V = JSON.parse(dump.v || '[]'); G = JSON.parse(dump.d || '[]'); E = JSON.parse(dump.e || '[]'); X = dump.x ? JSON.parse(dump.x) : null; } catch (e) { return ['JSON inválido: ' + e.message]; }
  const ids = new Set(); const fin = x => typeof x === 'number' && isFinite(x);
  V.forEach(v => {
    if (ids.has(v.id)) p.push('venda duplicada ' + v.id); ids.add(v.id);
    if (!/^\d{4}-\d\d-\d\d$/.test(v.day)) p.push('dia inválido ' + v.id);
    if (![v.subtotal, v.discount, v.total].every(fin)) p.push('valor não numérico ' + v.id + ' ' + [v.subtotal, v.discount, v.total]);
    if (Math.abs(v.subtotal - v.discount - v.total) > 0.011) p.push('total ≠ subtotal − desconto ' + v.id + ' ' + [v.subtotal, v.discount, v.total]);
    if (v.total < 0 || v.discount < 0) p.push('negativo ' + v.id);
    if (!Array.isArray(v.items) || !v.items.length) p.push('venda sem itens ' + v.id);
    (v.items || []).forEach(i => { if (!fin(i.qty) || i.qty <= 0 || !fin(i.unitPrice) || i.unitPrice < 0) p.push('item inválido ' + v.id + ' ' + JSON.stringify(i)); });
    const sub = (v.items || []).reduce((t, i) => t + i.qty * i.unitPrice, 0); if (Math.abs(sub - v.subtotal) > 0.011) p.push('subtotal ≠ itens ' + v.id + ' ' + sub + ' ' + v.subtotal);
    if (v.split) { const s = v.split.reduce((t, x) => t + x.valor, 0); if (Math.abs(s - v.total) > 0.011) p.push('partes ≠ total ' + v.id); }
    if (v.pay === 'fiado' && !(v.cliente || '').trim()) p.push('fiado sem nome ' + v.id);
    const r = (v.recebimentos || []).reduce((t, x) => t + (x.valor || 0), 0); if (r > v.total + 0.011) p.push('recebeu mais que o total ' + v.id);
    if (v.recebimentos && v.pay !== 'fiado') p.push('recebimento em venda que não é fiado ' + v.id);
  });
  const gids = new Set(); G.forEach(g => { if (gids.has(g.id)) p.push('gasto duplicado ' + g.id); gids.add(g.id); if (!fin(g.valor) || g.valor <= 0) p.push('gasto inválido ' + g.id + ' ' + g.valor); });
  const eids = new Set(); E.forEach(x => { if (eids.has(x.id)) p.push('produto duplicado ' + x.id); eids.add(x.id); if (!fin(Number(x.qty))) p.push('quantidade inválida ' + x.id + ' ' + x.qty); if (x.preco != null && !fin(Number(x.preco))) p.push('preço inválido ' + x.id); });
  if (X) Object.keys(X).forEach(k => { if (Array.isArray(X[k])) { const s = new Set(); X[k].forEach(r => { if (s.has(r.id)) p.push('extras duplicado ' + k + ' ' + r.id); s.add(r.id); }); } });
  return p;
}
(async () => {
  const b = await chromium.launch({ executablePath: CHROMIUM });
  const ctx = await b.newContext({ viewport: { width: LARG, height: LARG < 600 ? 844 : 900 }, acceptDownloads: true });
  await ctx.clock.install({ time: new Date('2026-10-20T15:00:00') });
  await ctx.route('**/*', r => r.request().url().startsWith('file:') ? r.continue() : r.abort());
  const p = await ctx.newPage(); const errs = []; p.on('pageerror', e => errs.push(e.message)); p.on('dialog', d => d.accept().catch(() => {}));
  ctx.on('page', np => { if (np !== p) np.close().catch(() => {}); });
  await p.goto(APP);
  const D = gerar(); await p.evaluate(d => { localStorage.clear(); localStorage.setItem('chaveiro_vendas_v2', JSON.stringify(d.vendas)); localStorage.setItem('chaveiro_despesas_v1', JSON.stringify(d.despesas)); localStorage.setItem('chaveiro_estoque_v1', JSON.stringify(d.estoque)); localStorage.setItem('chaveiro_extras_v1', JSON.stringify(d.extras)); localStorage.setItem('chaveiro_meta_v1', '6000'); }, D);
  await p.reload(); await p.waitForSelector('#registrarBtn');
  await p.evaluate(() => { window.showOpenFilePicker = undefined; window.showSaveFilePicker = undefined; HTMLInputElement.prototype.showPicker = function () {}; const c = HTMLInputElement.prototype.click; HTMLInputElement.prototype.click = function () { if (this.type !== 'file') return c.call(this); }; window.open = () => null; });
  const log = []; let problemas = [];
  for (let n = 0; n < N; n++) {
    const tipo = rnd();
    let desc = '';
    try {
      if (rnd() < 0.45) { // passo de uma venda/gasto de verdade
        const passos = [
          ['+ item', async () => { const bs = await p.$$('#saleFormWrap .step-btn.plus:not([disabled]), #saleFormWrap [data-fav]'); const vis = []; for (const x of bs) if (await x.isVisible()) vis.push(x); if (vis.length) await pick(vis).click({ timeout: 1500 }); }],
          ['valor', async () => { const is = await p.$$('[data-price-cat], [data-outro-price], [data-sp-price]'); for (const i of is) if (await i.isVisible() && !(await i.inputValue())) await i.fill(String(5 + Math.floor(rnd() * 200)), { timeout: 1500 }); }],
          ['forma', async () => { const f = pick(['dinheiro', 'pix', 'cartao', 'fiado']); await p.click('.pay-btn[data-pay="' + f + '"]', { timeout: 1500 }); if (f === 'fiado') await p.fill('#clienteInput', pick(['Cliente Teste A', 'Cliente Teste B', 'Zé']), { timeout: 1500 }); }],
          ['registrar', async () => { await p.click('[data-tab="vendas"]', { timeout: 1500 }); const r = await p.$('#registrarBtn'); if (r && await r.isEnabled()) await r.click({ timeout: 1500 }); const y = await p.$('#modal:not([hidden]) #modalYes'); if (y) await y.click(); }],
          ['outro', async () => { await p.click('#outroAddBtn', { timeout: 1500 }); await p.fill('[data-outro-desc]:last-of-type', pick(['CHAVEIRO', 'CONSERTO', 'X']), { timeout: 1500 }).catch(() => {}); }],
          ['gasto', async () => { await p.click('[data-tab="despesas"]', { timeout: 1500 }); await p.fill('#expDesc', pick(['café', 'luz', 'material'])); await p.fill('#expValor', String(1 + Math.floor(rnd() * 90))); await p.click('#registrarGastoBtn'); const y = await p.$('#modal:not([hidden]) #modalYes'); if (y) await y.click(); await p.click('[data-tab="vendas"]'); }],
          ['remove', async () => { const d = await p.$$('#history .s-del'); if (d.length) { await pick(d).click({ timeout: 1500 }); await p.click('#history .s-confirm-btn.yes', { timeout: 1500 }); } }],
          ['desfaz', async () => { const u = await p.$('#toast .t-undo'); if (u && await u.isVisible()) await u.click(); }],
          ['recupera', async () => { await p.click('[data-tab="resumo"]', { timeout: 1500 }); await p.evaluate(() => { const c = document.getElementById('lixCard'); if (c) c.open = true; }); const r = await p.$$('[data-lix]'); if (r.length) await pick(r).click(); await p.click('[data-tab="vendas"]'); }],
        ];
        const [nome, fn] = pick(passos); desc = 'fluxo ' + nome; await fn();
      } else if (tipo < 0.62) { // toca num botão/elemento clicável visível
        const alvos = await p.$$eval('button:not([disabled]), summary, [data-tab], a[href^="#"], label', els => els.map((e, i) => { const r = e.getBoundingClientRect(); return r.width > 0 && r.height > 0 && getComputedStyle(e).visibility !== 'hidden' && !e.closest('[hidden]') ? i : -1; }).filter(i => i >= 0));
        if (!alvos.length) continue;
        const i = pick(alvos); const h = (await p.$$('button:not([disabled]), summary, [data-tab], a[href^="#"], label'))[i];
        desc = 'toque ' + (await h.evaluate(e => (e.id ? '#' + e.id + ' ' : '') + (e.className || e.tagName) + ' "' + e.textContent.trim().slice(0, 30) + '"'));
        if (/backupBtn|exportXlsx|exportBtn|restoreBtn|Criar arquivo|Usar arquivo|fileConnect/i.test(desc) && rnd() < 0.8) continue;
        await h.click({ timeout: 1500, force: rnd() < 0.1 });
      } else if (tipo < 0.9) { // digita em um campo visível
        const campos = await p.$$('input:not([type=file]):not([type=checkbox]):not([type=date]), textarea');
        const vis = []; for (const c of campos) if (await c.isVisible()) vis.push(c);
        if (!vis.length) continue; const c = pick(vis); const t = pick(TEXTOS);
        desc = 'digita "' + t + '" em ' + await c.evaluate(e => e.id || e.getAttribute('data-price-cat') || e.getAttribute('placeholder') || e.outerHTML.slice(0, 60));
        await c.fill(t, { timeout: 1500 }); if (rnd() < 0.3) await c.press('Enter');
      } else if (tipo < 0.95) { // escolhe opção em select
        const ss = await p.$$('select'); const vis = []; for (const s of ss) if (await s.isVisible()) vis.push(s); if (!vis.length) continue;
        const s = pick(vis); const ops = await s.$$eval('option', o => o.map(x => x.value)); const o = pick(ops); desc = 'escolhe ' + o; await s.selectOption(o, { timeout: 1500 });
      } else if (tipo < 0.97) { desc = 'Esc'; await p.keyboard.press('Escape'); }
      else if (tipo < 0.985) { desc = 'recarrega'; await p.reload(); await p.waitForSelector('#registrarBtn'); await p.evaluate(() => { window.showOpenFilePicker = undefined; window.open = () => null; const c = HTMLInputElement.prototype.click; HTMLInputElement.prototype.click = function () { if (this.type !== 'file') return c.call(this); }; }); }
      else { desc = 'passa 1 hora'; await ctx.clock.fastForward('01:00:00'); }
    } catch (e) { desc += ' (falhou: ' + e.message.split('\n')[0].slice(0, 80) + ')'; }
    await p.waitForTimeout(30);
    log.push(n + ': ' + desc);
    const dump = await p.evaluate(() => ({ v: localStorage.getItem('chaveiro_vendas_v2'), d: localStorage.getItem('chaveiro_despesas_v1'), e: localStorage.getItem('chaveiro_estoque_v1'), x: localStorage.getItem('chaveiro_extras_v1') })).catch(() => null);
    if (dump) { problemas = regras(dump); const nv = JSON.parse(dump.v).length; if (global.__nv !== undefined && nv > global.__nv) global.__mais = (global.__mais || 0) + (nv - global.__nv); if (global.__nv !== undefined && nv < global.__nv) global.__menos = (global.__menos || 0) + (global.__nv - nv); global.__nv = nv; }
    if (errs.length || problemas.length) { console.log('PROBLEMA depois da ação ' + n + ':', errs.slice(0, 3), problemas.slice(0, 5)); console.log(log.slice(-12).join('\n')); await p.screenshot({ path: require('os').tmpdir() + '/caos_' + SEMENTE + '.png', fullPage: false }); break; }
  }
  const fim = await p.evaluate(() => [JSON.parse(localStorage.getItem('chaveiro_vendas_v2')).length, JSON.parse(localStorage.getItem('chaveiro_despesas_v1')).length]).catch(() => '?');
  console.log(`vendas registradas/recuperadas ${global.__mais || 0}, removidas ${global.__menos || 0}`); const ruim = errs.length || problemas.length; console.log(`semente ${SEMENTE}: ${log.length} ações, erros JS ${errs.length}, problemas ${problemas.length}, vendas/gastos no fim ${fim}`);
  await b.close(); process.exit(ruim ? 1 : 0);
})();
