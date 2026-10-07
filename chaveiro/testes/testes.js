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

  console.log('Funciona sem internet');
  const html = fs.readFileSync(path.resolve(__dirname, '..', 'Chaveiro_Vendas_e_Gastos.html'), 'utf8');
  const externos = [...html.matchAll(/<(?:link|script|img|iframe)\b[^>]*\b(?:href|src)=["']?(https?:)?\/\/[^"'\s>]+/gi), ...html.matchAll(/url\(\s*["']?https?:\/\/[^)]+\)/gi), ...html.matchAll(/@import\s+["']?https?:/gi)].map(m => m[0].slice(0, 90));
  ok(externos.length === 0, 'nenhum arquivo carregado da internet (fontes e ícone estão dentro do arquivo) ' + externos.join(' | '));
  ok(/@font-face\{font-family:'Fraunces'/.test(html) && /@font-face\{font-family:'IBM Plex Sans'/.test(html) && /@font-face\{font-family:'JetBrains Mono'/.test(html), 'as três fontes estão embutidas');
  { const c = await b.newContext(); const pg = await c.newPage(); const fora = []; await c.route('**/*', r => { if (!r.request().url().startsWith('file:') && !r.request().url().startsWith('data:')) { fora.push(r.request().url()); return r.abort(); } return r.continue(); });
    await pg.goto(APP); await pg.waitForSelector('#registrarBtn'); await pg.evaluate(() => document.fonts.ready);
    const fontes = await pg.evaluate(() => ['Fraunces', 'IBM Plex Sans', 'JetBrains Mono'].map(f => document.fonts.check('600 16px "' + f + '"')));
    ok(fora.length === 0 && fontes.every(Boolean), 'abre sem pedir nada à internet e com as fontes certas ' + fora.join(' ') + ' ' + fontes); await c.close(); }

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

  console.log('Aviso de estoque e apagados recentemente');
  ({ ctx, p, errs } = await abre(b, D));
  const p1 = D.estoque.find(x => x.id === 'p1');
  await p.fill('[data-stock-box="0"]', p1.modelo); await p.waitForTimeout(80); await p.click('#stockResults-0 [data-pid="p1"]');
  await p.click('.pay-btn[data-pay="pix"]'); await p.click('#registrarBtn'); await p.waitForTimeout(200);
  ok(/chegou ao mínimo \(3\).*lista de Comprar/.test(await p.textContent('#toast')), 'venda que leva o produto ao mínimo avisa: ' + norm(await p.textContent('#toast')));
  const vRem = await ultima(p), est1 = (await lsJ(p, K.estoque)).find(x => x.id === 'p1').qty;
  await p.click(`#history .sale-item[data-id="${vRem.id}"] .s-del`); await p.click('#history .s-confirm-btn.yes'); await p.waitForTimeout(200);
  ok(!(await lsJ(p, K.vendas)).some(v => v.id === vRem.id) && (await lsJ(p, K.estoque)).find(x => x.id === 'p1').qty === est1 + 1, 'venda removida e o estoque volta');
  ok((await lsJ(p, K.extras)).lixeira.some(r => r.tipo === 'venda' && r.reg.id === vRem.id), 'a venda removida fica guardada nos apagados');
  await p.click('#toast .t-undo'); await p.waitForTimeout(200);
  await p.click('[data-tab="resumo"]'); await p.waitForTimeout(150);
  ok(!(await p.$('#lixCard')), 'depois do Desfazer ela não aparece em Apagados');
  await p.click('[data-tab="vendas"]');
  await p.click(`#history .sale-item[data-id="${vRem.id}"] .s-del`); await p.click('#history .s-confirm-btn.yes'); await p.waitForTimeout(200);
  await p.click('[data-tab="despesas"]'); await p.fill('#expDesc', 'teste lixeira'); await p.selectOption('#expCat', 'outros'); await p.fill('#expValor', '9'); await p.click('#registrarGastoBtn'); await p.waitForTimeout(200);
  const gId = (await lsJ(p, K.despesas)).find(e => e.desc === 'teste lixeira').id;
  await p.click('#expHistory .s-del'); await p.click('#expHistory .s-confirm-btn.yes'); await p.waitForTimeout(200);
  await p.click('[data-tab="resumo"]'); await p.waitForTimeout(150);
  ok(norm(await p.textContent('#lixCard summary')) === '🗑 Apagados recentemente (2)', 'Resumo mostra 2 apagados (venda e gasto)');
  await p.click('#lixCard summary');
  const linhas = await p.$$eval('#lixCard .lix-row', rs => rs.map(r => r.textContent.replace(/\s+/g, ' ')));
  ok(linhas.length === 2 && linhas.some(t => /Venda de 20\/10/.test(t) && /Pix/.test(t)) && linhas.some(t => /Gasto de 20\/10/.test(t) && /teste lixeira/.test(t)), 'lista diz o que foi apagado: ' + linhas.join(' | '));
  const nV = (await lsJ(p, K.vendas)).length;
  await p.click('#lixCard .lix-row:has-text("Venda") [data-lix]'); await p.waitForTimeout(200);
  ok((await lsJ(p, K.vendas)).length === nV + 1 && (await lsJ(p, K.vendas)).some(v => v.id === vRem.id && v.total === vRem.total), 'Recuperar devolve a venda igual, com o mesmo ID');
  ok((await lsJ(p, K.estoque)).find(x => x.id === 'p1').qty === est1, 'e desconta o estoque de novo');
  await p.click('#lixCard .lix-row [data-lix]'); await p.waitForTimeout(200);
  ok((await lsJ(p, K.despesas)).some(e => e.id === gId) && !(await p.$('#lixCard')), 'gasto recuperado; sem apagados, o cartão some');
  await p.click('[data-tab="vendas"]'); await p.click('#history .sale-item .s-del'); await p.click('#history .s-confirm-btn.yes'); await p.waitForTimeout(150);
  await p.click('[data-tab="resumo"]'); await p.waitForTimeout(150);
  const [bk2] = await Promise.all([p.waitForEvent('download'), p.click('#backupBtn')]); const bk2Path = path.join(TMP, 'backup2.json'); await bk2.saveAs(bk2Path);
  ok(JSON.parse(fs.readFileSync(bk2Path, 'utf8')).extras.lixeira.length >= 1, 'os apagados vão junto no backup');
  ok(errs.length === 0, 'sem erros de JavaScript ' + errs.join(' | '));
  await ctx.close();

  console.log('Cópias automáticas');
  ctx = await b.newContext({ viewport: { width: 1366, height: 900 }, acceptDownloads: true });
  await ctx.clock.install({ time: new Date('2026-10-05T09:00:00') });
  p = await ctx.newPage(); errs = []; p.on('pageerror', e => errs.push(e.message)); p.on('dialog', d => d.accept());
  await p.goto(APP); await p.evaluate(({ d, K }) => { ['vendas', 'despesas', 'estoque'].forEach(k => localStorage.setItem(K[k], JSON.stringify(d[k]))); }, { d: D, K });
  for (let dia = 5; dia <= 14; dia++) {
    await ctx.clock.setSystemTime(new Date(`2026-10-${String(dia).padStart(2, '0')}T09:00:00`));
    await p.reload(); await p.waitForSelector('#registrarBtn'); await p.waitForTimeout(250);
  }
  const chaves = await p.evaluate(() => new Promise(r => { const q = indexedDB.open('chaveiro_copias'); q.onsuccess = () => { const g = q.result.transaction('c').objectStore('c').getAllKeys(); g.onsuccess = () => r(g.result); }; }));
  ok(chaves.length === 7 && chaves[0] === '2026-10-08' && chaves[6] === '2026-10-14', 'uma cópia por dia, ficam as 7 mais recentes: ' + chaves.join(', '));
  await p.click('[data-tab="resumo"]'); await p.waitForTimeout(300);
  ok((await p.$$('#copiasAuto [data-copia]')).length === 7, 'Backup mostra as 7 cópias para baixar');
  const nAntes = (await lsJ(p, K.vendas)).length;
  const [cp] = await Promise.all([p.waitForEvent('download'), p.click('#copiasAuto [data-copia="2026-10-14"]')]);
  const cpPath = path.join(TMP, cp.suggestedFilename()); await cp.saveAs(cpPath);
  const cj = JSON.parse(fs.readFileSync(cpPath, 'utf8'));
  ok(cj.app === 'chaveiro' && cj.vendas.length === nAntes && cj.copiaAutomatica === '2026-10-14', 'a cópia baixada é um backup completo do dia');
  ok(errs.length === 0, 'sem erros de JavaScript ' + errs.join(' | '));
  await ctx.close();

  console.log('Comparação com o mês passado e tamanho do texto');
  ({ ctx, p, errs } = await abre(b, D));
  await p.click('[data-tab="resumo"]'); await p.waitForTimeout(150);
  const sum = (m, ate) => D.vendas.filter(v => v.day.slice(0, 7) === m && +v.day.slice(8) <= ate).reduce((t, v) => t + v.total, 0);
  const tc = sum('2026-10', 31), tpp = sum('2026-09', 20), esp = Math.abs(Math.round((tc - tpp) / tpp * 100));
  const txt = norm(await p.textContent('#resumoContent'));
  ok(txt.includes(esp + '% em relação aos mesmos dias do mês passado (dia 1 a 20'), `outubro (até dia 20) comparado com 1 a 20 de setembro: ${esp}%`);
  const exAntes = await p.evaluate(k => localStorage.getItem(k), K.extras);
  await p.click('#ajustesCard summary'); await p.click('[data-zoom="1.25"]'); await p.waitForTimeout(150);
  ok(await p.evaluate(() => document.documentElement.style.zoom) === '1.25', 'texto "Maior" aumenta a tela na hora');
  await p.reload(); await p.waitForSelector('#registrarBtn');
  ok(await p.evaluate(() => document.documentElement.style.zoom) === '1.25' && await p.evaluate(k => localStorage.getItem(k), K.extras) === exAntes, 'continua depois de recarregar e não mexe nos dados');
  await p.setViewportSize({ width: 390, height: 844 });
  let larg = 0; for (const t of ['vendas', 'estoque', 'despesas', 'resumo']) { await p.click(`[data-tab="${t}"]`); await p.waitForTimeout(120); larg = Math.max(larg, await p.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth)); }
  ok(larg <= 1, 'no celular com texto Maior nada passa da largura da tela');
  ok(errs.length === 0, 'sem erros de JavaScript ' + errs.join(' | '));
  await ctx.close();

  console.log('Venda pela metade');
  ({ ctx, p, errs } = await abre(b, D));
  let perguntou = false; p.removeAllListeners('dialog'); p.on('dialog', d => { if (d.type() === 'beforeunload') perguntou = true; d.accept(); });
  await p.reload(); await p.waitForSelector('#registrarBtn'); ok(!perguntou, 'sem venda em andamento recarrega sem perguntar');
  await p.click('.step-btn.plus[data-cat="carro"]');
  await p.reload(); await p.waitForSelector('#registrarBtn'); ok(perguntou, 'com item na venda, o navegador pergunta antes de sair');
  await ctx.close();

  console.log('Valores mais cobrados e venda em andamento');
  ({ ctx, p, errs } = await abre(b, D));
  await p.click('.step-btn.plus[data-cat="carro"]'); await p.waitForTimeout(80);
  const sug = await p.$$eval('[data-preco-sug="carro"]', bs => bs.map(x => x.textContent.replace(/\s/g, ' ')));
  ok(sug.length === 2 && /120,00/.test(sug[0]) && /90,00/.test(sug[1]), 'Carro mostra os valores cobrados 2+ vezes, o mais comum primeiro: ' + sug.join(' | '));
  await p.click('[data-preco-sug="carro"][data-v="120,00"]'); await p.waitForTimeout(80);
  ok(await p.inputValue('[data-price-cat="carro"]') === '120,00' && /120,00/.test(await p.textContent('#totalDisplay')), 'um toque preenche o valor e o total');
  await p.fill('[data-stock-box="0"]', D.estoque[5].modelo); await p.waitForTimeout(80); await p.click(`#stockResults-0 [data-pid="${D.estoque[5].id}"]`);
  await p.click('.pay-btn[data-pay="fiado"]'); await p.fill('#clienteInput', 'Cliente Teste B'); await p.waitForTimeout(300);
  p.removeAllListeners('dialog'); p.on('dialog', d => d.accept());
  const nV0 = (await lsJ(p, K.vendas)).length;
  await p.reload(); await p.waitForSelector('#registrarBtn'); await p.waitForTimeout(200);
  ok(await p.inputValue('[data-price-cat="carro"]') === '120,00' && await p.$(`#saleFormWrap [data-pid="${D.estoque[5].id}"]`) !== null, 'depois de recarregar, a venda em andamento volta (carro e produto)');
  ok(await p.inputValue('#clienteInput') === 'Cliente Teste B' && (await p.getAttribute('.pay-btn[data-pay="fiado"]', 'class')).includes('on'), 'com a forma de pagamento e o nome do fiado');
  ok((await lsJ(p, K.vendas)).length === nV0, 'recuperar não registra nada sozinho');
  await p.click('#registrarBtn'); await p.waitForTimeout(250);
  ok((await lsJ(p, K.vendas)).length === nV0 + 1 && await p.evaluate(() => localStorage.getItem('chaveiro_rascunho_v1')) === null, 'registrada, o rascunho é apagado');
  await p.reload(); await p.waitForSelector('#registrarBtn'); await p.waitForTimeout(200);
  ok(!(await p.$('[data-price-cat="carro"]')) && (await lsJ(p, K.vendas)).length === nV0 + 1, 'recarregar de novo não traz a venda de volta (sem duplicar)');
  ok(errs.length === 0, 'sem erros de JavaScript ' + errs.join(' | '));
  await ctx.close();

  console.log('Android: enviar arquivos e tela acesa');
  ctx = await b.newContext({ viewport: { width: 390, height: 844 }, acceptDownloads: true });
  await ctx.clock.install({ time: new Date(AGORA) });
  await ctx.addInitScript(() => { // simula o Chrome do Android: compartilhar arquivos e trava de tela
    window.__enviados = []; window.__trava = 0;
    navigator.canShare = d => !!(d && d.files && d.files.length);
    navigator.share = d => { window.__enviados.push(d.files.map(f => f.name + ':' + f.type + ':' + f.size)); return Promise.resolve(); };
    Object.defineProperty(navigator, 'wakeLock', { value: { request: () => { window.__trava++; return Promise.resolve({ released: false, release: () => { window.__trava--; return Promise.resolve(); } }); } } });
  });
  p = await ctx.newPage(); errs = []; p.on('pageerror', e => errs.push(e.message)); p.on('dialog', d => d.accept());
  await p.goto(APP); await p.evaluate(({ d, K }) => { localStorage.clear(); ['vendas', 'despesas', 'estoque'].forEach(k => localStorage.setItem(K[k], JSON.stringify(d[k]))); }, { d: D, K });
  await p.reload(); await p.waitForSelector('#registrarBtn'); await p.click('[data-tab="resumo"]'); await p.waitForTimeout(150);
  await p.click('#backupEnviar'); await p.waitForTimeout(150);
  let env = await p.evaluate(() => window.__enviados);
  ok(env.length === 1 && /^chaveiro-backup-2026-10-20\.json:application\/json:\d+$/.test(env[0][0]) && +env[0][0].split(':')[2] > 10000, 'backup enviado pelo menu do aparelho: ' + env[0]);
  await p.click('#exportXlsx'); await p.waitForSelector('#exportEnviar'); await p.click('#exportEnviar'); await p.waitForTimeout(150);
  env = await p.evaluate(() => window.__enviados);
  ok(env.length === 2 && /^Chaveiro_Relatorio_2026-10\.xlsx:application\/vnd\.openxmlformats/.test(env[1][0]), 'Excel enviado direto para a contadora: ' + env[1]);
  await p.click('#ajustesCard summary'); await p.click('#ajAcesa'); await p.waitForTimeout(100);
  ok(await p.evaluate(() => window.__trava) === 1, '"Manter a tela acesa" liga a trava da tela');
  await p.reload(); await p.waitForSelector('#registrarBtn'); await p.waitForTimeout(150);
  ok(await p.evaluate(() => window.__trava) === 1, 'continua ligada ao abrir de novo');
  await p.click('[data-tab="resumo"]'); await p.evaluate(() => { document.getElementById('ajustesCard').open = true; }); await p.click('#ajAcesa'); await p.waitForTimeout(100);
  ok(await p.evaluate(() => window.__trava) === 0, 'desligar solta a trava');
  ok(errs.length === 0, 'sem erros de JavaScript ' + errs.join(' | '));
  await ctx.close();
  ({ ctx, p, errs } = await abre(b, D));
  await p.click('[data-tab="resumo"]');
  ok(!(await p.$('#backupEnviar')) && (await p.$$('#ajAcesa')).length === (await p.evaluate(() => 'wakeLock' in navigator) ? 1 : 0), 'onde o navegador não envia arquivos, o botão não aparece');
  await ctx.close();

  console.log('Controle clonável (produto do estoque) e hora da venda');
  const comCtrl = JSON.parse(JSON.stringify(D)); comCtrl.estoque.push({ id: 'ctl', cat: 'Controle de portão', marca: 'Controle clonavel', modelo: '', qty: 2, preco: 80, min: 1 });
  ({ ctx, p, errs } = await abre(b, comCtrl));
  await p.click('[data-clone="1"]'); await p.waitForTimeout(80);
  await p.click('#registrarBtn'); await p.waitForTimeout(200);
  let vc = await ultima(p);
  ok(vc.total === 80 && vc.items.length === 1 && vc.items[0].pid === 'ctl' && (await lsJ(p, K.estoque)).find(x => x.id === 'ctl').qty === 1, 'clonável vende pelo estoque (R$ 80) e baixa 1');
  await p.click('[data-clone="1"]'); await p.waitForTimeout(80);
  ok(await p.isDisabled('[data-clone="1"]'), 'com a última unidade na venda, o + trava (não vende além do estoque)');
  await p.click('#registrarBtn'); await p.waitForTimeout(200);
  ok((await lsJ(p, K.estoque)).find(x => x.id === 'ctl').qty === 0 && await p.isDisabled('[data-clone="1"]'), 'estoque zerado: o botão continua travado, como sempre foi');
  // hora da venda lançada depois
  await p.click('.step-btn.plus[data-cat="simples"]'); await p.click('#horaAjustar'); await p.fill('#horaVenda', '23:30'); await p.dispatchEvent('#horaVenda', 'change'); await p.waitForTimeout(80);
  ok(await p.isDisabled('#registrarBtn') && /ainda não chegou/.test(await p.textContent('#saleTotalsWrap')), 'hora no futuro (23:30, agora 15:00) não registra');
  await p.fill('#horaVenda', '10:30'); await p.dispatchEvent('#horaVenda', 'change'); await p.waitForTimeout(80);
  await p.click('#registrarBtn'); await p.waitForTimeout(200);
  vc = await ultima(p); const hv = new Date(vc.ts);
  ok(vc.day === '2026-10-20' && hv.getHours() === 10 && hv.getMinutes() === 30 && vc.manual === false, 'venda gravada às 10:30 de hoje');
  ok(await p.$('#horaAjustar') !== null, 'a próxima venda volta para a hora de agora');
  await p.click('.step-btn.plus[data-cat="simples"]'); await p.click('#registrarBtn'); await p.waitForTimeout(200);
  ok(new Date((await ultima(p)).ts).getHours() === 15, 'e grava 15h normalmente');
  ok(errs.length === 0, 'sem erros de JavaScript ' + errs.join(' | '));
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
