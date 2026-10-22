// Robô do caixa (laboratório de ideias): refaz pela tela, no tamanho do notebook, as vendas de um arquivo
// de dados (backup do app), pelo caminho mais curto que o app oferece, e conta toques e letras.
// Serve para medir se uma ideia economiza trabalho de verdade: rode antes e depois da mudança e compare.
// Uso: node chaveiro/laboratorio/robo_caixa.js dados.json [app.html]
// Dados reais ficam fora do repositório (numa pasta temporária); o robô não grava nada fora do navegador.
// Não refaz desconto nem pagamento dividido: essas vendas aparecem como PULADA.
// DIFERENTE = a venda gravada não ficou igual à original (total, forma de pagamento ou número de itens).
'use strict';
const fs = require('fs'), path = require('path');
let pw; try { pw = require('playwright'); } catch (e) { pw = require('/opt/node-tools/node_modules/playwright'); }

const DADOS = JSON.parse(fs.readFileSync(process.argv[2], 'utf8'));
const APP = 'file://' + path.resolve(process.argv[3] || path.join(__dirname, '..', 'Chaveiro_Vendas_e_Gastos.html'));
const CHROMIUM = process.env.CHROMIUM || (fs.existsSync('/opt/pw-browsers/chromium') ? '/opt/pw-browsers/chromium' : undefined);

(async () => {
  const vendas = DADOS.vendas.slice().sort((a, b) => a.ts - b.ts);
  const b = await pw.chromium.launch({ executablePath: CHROMIUM });
  const ctx = await b.newContext({ viewport: { width: 1366, height: 768 } });
  await ctx.clock.install({ time: new Date(vendas[0].ts - 60000) });
  const p = await ctx.newPage(), errs = [];
  p.setDefaultTimeout(5000);
  p.on('pageerror', e => errs.push(e.message)); p.on('dialog', d => d.accept());
  await p.goto(APP);
  await p.evaluate(d => {
    localStorage.clear();
    localStorage.setItem('chaveiro_vendas_v2', '[]'); localStorage.setItem('chaveiro_despesas_v1', '[]');
    localStorage.setItem('chaveiro_estoque_v1', JSON.stringify(d.estoque || []));
  }, DADOS);
  await p.reload(); await p.waitForSelector('#registrarBtn');
  let toques = 0, letras = 0, puladas = 0, falhas = 0; const linhas = [];
  const toca = async sel => { await p.locator(sel).first().scrollIntoViewIfNeeded(); await p.locator(sel).first().click(); toques++; await p.waitForTimeout(30); };
  const digita = async (sel, t) => { await p.locator(sel).first().fill(''); await p.locator(sel).first().pressSequentially(t); letras += t.length; await p.waitForTimeout(30); };
  // valor que o app já preencheu (preço padrão ou lembrado): só digita se for diferente do vendido
  const valor = async (sel, v) => {
    const atual = Number(String(await p.inputValue(sel)).replace(/\./g, '').replace(',', '.'));
    if (atual !== v) { await digita(sel, String(v).replace('.', ',')); return true; }
    return false;
  };

  for (const v of vendas) {
    const quando = `${v.day.slice(5)} ${new Date(v.ts).toTimeString().slice(0, 5)} R$${v.total} ${v.pay}`;
    if (v.discount || v.split) { puladas++; linhas.push(quando + ': PULADA (desconto ou pagamento dividido)'); continue; }
    await ctx.clock.setSystemTime(new Date(v.ts));
    const t0 = toques, l0 = letras, como = [];
    try {
      for (const it of v.items) {
        for (let q = 0; q < it.qty; q++) {
          if (it.cat === 'estoque') {
            const fav = p.locator(`[data-fav="p:${it.pid}"]`);
            if (await fav.count() && await fav.first().isVisible()) { await toca(`[data-fav="p:${it.pid}"]`); como.push('atalho'); continue; }
            if (q > 0 && await p.locator(`.stk-plus[data-pid="${it.pid}"]`).count()) { await toca(`.stk-plus[data-pid="${it.pid}"]`); como.push('+'); continue; }
            const pr = (DADOS.estoque || []).find(e => e.id === it.pid) || {}, mod = String(pr.modelo || '').split(' ')[0];
            let achou = false; // a menor busca que põe o produto em primeiro: só o modelo, depois marca + modelo
            for (const qq of [mod, pr.marca + ' ' + mod]) {
              await digita('[data-stock-box="0"]', qq);
              const first = await p.locator('#stockResults-0 .stk-res').first().getAttribute('data-pid').catch(() => null);
              if (first === it.pid) { await toca(`#stockResults-0 [data-pid="${it.pid}"]`); como.push('busca "' + qq + '"'); achou = true; break; }
            }
            if (!achou) { await toca(`#stockResults-0 [data-pid="${it.pid}"]`); como.push('busca e escolhe'); }
          } else if (it.cat === 'outros') {
            const sug = p.locator('[data-outro-sug]').filter({ hasText: new RegExp(it.desc.trim().split(/\s+/)[0], 'i') });
            if (await sug.count() && await sug.first().isVisible() && (await sug.first().textContent()).includes(String(it.unitPrice))) { await sug.first().click(); toques++; como.push('sugestão de Outros'); continue; }
            if (q > 0) { await toca('[data-outro-plus]:last-of-type'); como.push('+'); continue; }
            await toca('#outroAddBtn'); const i = await p.locator('[data-outro-desc]').count() - 1;
            await digita(`[data-outro-desc="${i}"]`, it.desc);
            como.push(await valor(`[data-outro-price="${i}"]`, it.unitPrice) ? 'Outros digitado' : 'Outros digitado (valor lembrado)');
          } else {
            const btn = `.step-btn.plus[data-cat="${it.cat}"]`;
            if (!(await p.locator(btn).first().isVisible())) {
              const g = it.cat.startsWith('srv') ? '[data-group="svc"], .svc-head button, [data-svc-toggle]' : `[data-group="${it.cat.split('-')[0] === 'bateria' ? 'bateria' : 'pilha'}"]`;
              await toca(g).catch(() => {});
            }
            await toca(btn); const pc = `[data-price-cat="${it.cat}"]`;
            if (q === 0 && await p.locator(pc).count() && Number(String(await p.inputValue(pc)).replace(/\./g, '').replace(',', '.')) !== it.unitPrice) {
              const sg = p.locator(`[data-preco-sug="${it.cat}"][data-v="${String(it.unitPrice).replace('.', ',')}${Number.isInteger(it.unitPrice) ? ',00' : ''}"]`);
              if (await sg.count()) { await sg.first().click(); toques++; } else await valor(pc, it.unitPrice);
            }
            como.push(it.cat);
          }
        }
      }
      if (v.pay !== 'cartao') await toca(`.pay-btn[data-pay="${v.pay}"]`); // cartão já vem marcado
      if (v.pay === 'fiado') await digita('#clienteInput', v.cliente || 'Cliente');
      await toca('#registrarBtn');
      const y = p.locator('#modal:not([hidden]) #modalYes'); if (await y.count()) { await y.click(); toques++; }
      await p.waitForTimeout(80);
      const g = await p.evaluate(() => { const a = JSON.parse(localStorage.getItem('chaveiro_vendas_v2')); return a[a.length - 1]; });
      const igual = g && g.total === v.total && g.pay === v.pay && g.items.length === v.items.length;
      if (!igual) falhas++;
      linhas.push(`${quando}: ${toques - t0} toques + ${letras - l0} letras ${igual ? '' : '⚠ DIFERENTE ' + JSON.stringify(g && g.items)} [${como.join(', ')}]`);
    } catch (e) {
      falhas++;
      linhas.push(`${quando}: ⚠ NÃO CONSEGUIU (${String(e.message).split('\n')[0].slice(0, 90)}) [${como.join(', ')}]`);
      await p.evaluate(() => localStorage.removeItem('chaveiro_rascunho_v1')); await p.reload(); await p.waitForSelector('#registrarBtn');
    }
  }
  console.log(linhas.join('\n'));
  console.log(`TOTAL: ${toques} toques + ${letras} letras = ${toques + letras} ações em ${vendas.length - puladas} vendas` +
    ` · ${puladas} puladas · ${falhas} com problema · erros de JavaScript ${errs.length}`);
  await b.close();
})().catch(e => { console.error(e); process.exit(1); });
