// Restaura backups estragados de propósito (campos faltando, tipos errados, IDs repetidos, lixo).
// Regras: não trava, não perde nem altera nada que já estava salvo, não duplica, só entra o que é válido.
// Uso: node chaveiro/testes/backup_estragado.js [semente] [casos]
const path = require('path'); let pw; try { pw = require('playwright'); } catch (e) { pw = require('/opt/node-tools/node_modules/playwright'); } const { chromium } = pw;
const APP = 'file://' + path.resolve(__dirname, '..', 'Chaveiro_Vendas_e_Gastos.html'), CHROMIUM = process.env.CHROMIUM || (require('fs').existsSync('/opt/pw-browsers/chromium') ? '/opt/pw-browsers/chromium' : undefined); const fs = require('fs');
const { gerar } = require('./dados');
const SEM = +(process.argv[2] || 1), N = +(process.argv[3] || 200);
let seed = SEM; const rnd = () => (seed = (seed * 16807) % 2147483647) / 2147483647; const pick = a => a[Math.floor(rnd() * a.length)];
const LIXO = [null, undefined, '', 'x', 0, -1, 1e308, NaN, -0.0001, 3.14159, true, [], {}, [1, 2], { a: 1 }, '2026-13-45', '9999-99-99', 'ção', '<img src=x onerror=alert(1)>', '1e5', ' 12 ', Infinity];
function muta(o, prof) {
  if (Array.isArray(o)) { const a = o.slice(); const r = rnd(); if (r < .15 && a.length) a.splice(Math.floor(rnd() * a.length), 1); else if (r < .3 && a.length) a.push(JSON.parse(JSON.stringify(pick(a)))); else if (r < .4) a.push(pick(LIXO)); else if (a.length) { const i = Math.floor(rnd() * a.length); a[i] = muta(a[i], prof + 1); } return a; }
  if (o && typeof o === 'object') { const c = Object.assign({}, o), ks = Object.keys(c); if (!ks.length) return c; const k = pick(ks), r = rnd(); if (r < .2) delete c[k]; else if (r < .55 || prof > 4) c[k] = pick(LIXO); else c[k] = muta(c[k], prof + 1); return c; }
  return rnd() < .5 ? pick(LIXO) : o;
}
const fin = x => typeof x === 'number' && isFinite(x);
(async () => {
  const b = await chromium.launch({ executablePath: CHROMIUM });
  const ctx = await b.newContext(); await ctx.clock.install({ time: new Date('2026-10-20T15:00:00') });
  const p = await ctx.newPage(); const errs = []; p.on('pageerror', e => errs.push(e.message)); p.on('dialog', d => d.accept());
  const base = gerar(); const local = { vendas: base.vendas.slice(0, 60), despesas: base.despesas.slice(0, 3), estoque: base.estoque.slice(0, 20), extras: base.extras };
  const backupBom = { app: 'chaveiro', versao: 2, vendas: base.vendas.slice(40), despesas: base.despesas, estoque: base.estoque, meta: 6000, extras: base.extras };
  await p.goto(APP);
  let falhas = 0, travou = 0;
  for (let n = 0; n < N; n++) {
    await p.evaluate(d => { localStorage.clear(); localStorage.setItem('chaveiro_vendas_v2', JSON.stringify(d.vendas)); localStorage.setItem('chaveiro_despesas_v1', JSON.stringify(d.despesas)); localStorage.setItem('chaveiro_estoque_v1', JSON.stringify(d.estoque)); localStorage.setItem('chaveiro_extras_v1', JSON.stringify(d.extras)); }, local);
    await p.reload(); await p.waitForSelector('#registrarBtn'); errs.length = 0;
    let bk = JSON.parse(JSON.stringify(backupBom)); const k = 1 + Math.floor(rnd() * 8);
    for (let i = 0; i < k; i++) {
      const r = rnd();
      if (r < .2) bk = muta(bk, 0);
      else { const lst = r < .5 ? bk.vendas : r < .65 ? bk.estoque : r < .75 ? bk.despesas : bk.extras && bk.extras[pick(['fixos', 'encomendas', 'retrabalhos', 'lixeira', 'procuras'])];
        if (Array.isArray(lst) && lst.length) { const j = Math.floor(rnd() * lst.length); lst[j] = muta(lst[j], 1); if (rnd() < .3 && lst[j] && typeof lst[j] === 'object') { const o = pick(lst.filter(x => x && x.id)); if (o) lst[j].id = o.id; } } // às vezes repete um ID
        else if (bk.extras && rnd() < .3) bk.extras.cfg = muta(bk.extras.cfg || {}, 1); }
    }
    const txt = rnd() < 0.05 ? JSON.stringify(bk).slice(0, Math.floor(rnd() * 500)) : JSON.stringify(bk);
    fs.writeFileSync(require('os').tmpdir() + '/chaveiro_fz.json', txt);
    await p.click('[data-tab="resumo"]'); await p.setInputFiles('#restoreFile', require('os').tmpdir() + '/chaveiro_fz.json'); await p.waitForTimeout(150);
    const msg = await p.textContent('#backupMsg').catch(() => '?');
    const st = await p.evaluate(() => ({ v: JSON.parse(localStorage.getItem('chaveiro_vendas_v2')), d: JSON.parse(localStorage.getItem('chaveiro_despesas_v1')), e: JSON.parse(localStorage.getItem('chaveiro_estoque_v1')), x: JSON.parse(localStorage.getItem('chaveiro_extras_v1') || 'null') }));
    const prob = [];
    const byId = new Map(st.v.map(v => [v.id, v])); local.vendas.forEach(v => { const a = byId.get(v.id); if (!a) prob.push('venda local sumiu ' + v.id); else if (JSON.stringify(a) !== JSON.stringify(v)) prob.push('venda local alterada ' + v.id); });
    const gId = new Map(st.d.map(g => [g.id, g])); local.despesas.forEach(g => { if (JSON.stringify(gId.get(g.id)) !== JSON.stringify(g)) prob.push('gasto local perdido/alterado ' + g.id); });
    const eId = new Map(st.e.map(x => [x.id, x])); local.estoque.forEach(x => { const a = eId.get(x.id); if (!a) prob.push('produto sumiu ' + x.id); else if (Number(a.qty) !== Number(x.qty) && !(x.g)) prob.push('quantidade local mudou ' + x.id + ' ' + x.qty + '→' + a.qty); });
    if (byId.size !== st.v.length) prob.push('vendas duplicadas'); if (eId.size !== st.e.length) prob.push('produtos duplicados');
    st.v.forEach(v => { if (!/^\d{4}-\d\d-\d\d$/.test(v.day) || !fin(v.total) || !fin(v.subtotal) || !Array.isArray(v.items)) prob.push('venda inválida entrou ' + JSON.stringify(v).slice(0, 150)); else v.items.forEach(i => { if (!i || !fin(i.qty) || !fin(i.unitPrice)) prob.push('item inválido entrou ' + v.id + ' ' + JSON.stringify(i).slice(0, 100)); }); });
    st.d.forEach(g => { if (!fin(g.valor) || !/^\d{4}-\d\d-\d\d$/.test(g.day)) prob.push('gasto inválido entrou ' + JSON.stringify(g).slice(0, 120)); });
    st.e.forEach(x => { if (!fin(Number(x.qty))) prob.push('produto inválido entrou ' + JSON.stringify(x).slice(0, 120)); });
    for (const t of ['vendas', 'estoque', 'despesas', 'resumo']) await p.click(`[data-tab="${t}"]`).catch(e => prob.push('aba ' + t + ' não abre'));
    await p.reload(); await p.waitForSelector('#registrarBtn', { timeout: 4000 }).catch(() => { prob.push('app não abre depois'); travou++; });
    if (errs.length) prob.push('erros JS: ' + errs.slice(0, 2).join(' | '));
    if (prob.length) { falhas++; if (falhas <= 6) { console.log('CASO ' + n + ' (' + msg.slice(0, 120) + '):\n   ' + [...new Set(prob)].slice(0, 5).join('\n   ')); fs.writeFileSync(require('os').tmpdir() + '/chaveiro_fz_falha_' + SEM + '_' + n + '.json', txt); } }
  }
  console.log(`semente ${SEM}: ${N} backups estragados, ${falhas} com problema, ${travou} travaram`);
  await b.close(); process.exit(falhas ? 1 : 0);
})();
