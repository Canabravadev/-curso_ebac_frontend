// Acessibilidade (axe-core, regras WCAG 2.1 A e AA) nas telas principais, no tamanho do notebook,
// com o tema claro e o escuro. Usa os dados de exemplo e o relógio fixo dos testes.
// Uso: node chaveiro/testes/acessibilidade.js   (o axe-core vem de .claude/hooks/session-start.sh)
'use strict';
const fs = require('fs'), path = require('path'), os = require('os');
let pw; try { pw = require('playwright'); } catch (e) { pw = require('/opt/node-tools/node_modules/playwright'); }
const { gerar } = require('./dados');

const FERR = process.env.CHAVEIRO_FERRAMENTAS || path.join(os.homedir(), '.cache', 'chaveiro-ferramentas');
const APP = 'file://' + (process.env.CHAVEIRO_HTML || path.resolve(__dirname, '..', 'Chaveiro_Vendas_e_Gastos.html'));
const CHROMIUM = process.env.CHROMIUM || (fs.existsSync('/opt/pw-browsers/chromium') ? '/opt/pw-browsers/chromium' : undefined);
const K = { vendas: 'chaveiro_vendas_v2', despesas: 'chaveiro_despesas_v1', estoque: 'chaveiro_estoque_v1', meta: 'chaveiro_meta_v1', extras: 'chaveiro_extras_v1' };

// cada tela: nome e como chegar nela a partir da aba Vendas
const TELAS = [
  ['Vendas', async p => {}],
  ['Estoque', async p => p.click('[data-tab="estoque"]')],
  ['Produto novo', async p => { await p.click('[data-tab="estoque"]'); await p.click('#estNew'); }],
  ['Gastos', async p => p.click('[data-tab="despesas"]')],
  ['Resumo', async p => p.click('[data-tab="resumo"]')],
  ['Resumo com tudo aberto', async p => { await p.click('[data-tab="resumo"]'); await p.evaluate(() => document.querySelectorAll('details').forEach(d => { d.open = true; })); }],
  ['Escolher o dia', async p => p.click('#dateBtn')],
  ['Escolher o mês', async p => { await p.click('[data-tab="resumo"]'); await p.click('#monthBtn'); }],
  ['Busca (Ctrl+K)', async p => { await p.keyboard.press('Control+k'); await p.keyboard.type('hag'); }]
];

(async () => {
  let axe; try { axe = require.resolve('axe-core/axe.min.js', { paths: [FERR] }); } catch (e) { axe = null; }
  if (!axe) { console.log('PULADO: axe-core não está instalado em ' + FERR + ' (rode .claude/hooks/session-start.sh)'); return; }
  const AXE = fs.readFileSync(axe, 'utf8'), D = gerar();
  const b = await pw.chromium.launch({ executablePath: CHROMIUM });
  let problemas = 0, telas = 0;
  for (const tema of ['light', 'dark']) {
    for (const [nome, vai] of TELAS) {
      const ctx = await b.newContext({ viewport: { width: 1366, height: 768 }, colorScheme: tema });
      await ctx.clock.install({ time: new Date('2026-10-20T15:00:00') });
      const p = await ctx.newPage(), errs = [];
      p.on('pageerror', e => errs.push(e.message));
      await p.goto(APP);
      await p.evaluate(({ d, K }) => {
        localStorage.clear();
        ['vendas', 'despesas', 'estoque'].forEach(k => localStorage.setItem(K[k], JSON.stringify(d[k])));
        localStorage.setItem(K.meta, String(d.meta)); localStorage.setItem(K.extras, JSON.stringify(d.extras));
      }, { d: D, K });
      await p.reload(); await p.waitForSelector('#registrarBtn');
      await vai(p); await p.waitForTimeout(200);
      await p.addScriptTag({ content: AXE });
      const v = await p.evaluate(async () => (await window.axe.run(document, { runOnly: { type: 'tag', values: ['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa'] }, resultTypes: ['violations'] })).violations
        .map(x => x.impact + ' ' + x.id + ': ' + x.nodes.slice(0, 3).map(n => n.target.join(' ')).join(' | ')));
      telas++; problemas += v.length + errs.length;
      console.log(`  ${v.length || errs.length ? 'FALHA' : 'OK   '} ${tema === 'dark' ? 'escuro' : 'claro '} · ${nome}` + v.concat(errs.map(e => 'erro de JavaScript: ' + e)).map(x => '\n         ' + x).join(''));
      await ctx.close();
    }
  }
  await b.close();
  console.log(`Acessibilidade: ${telas} telas, ${problemas} problema(s)`);
  process.exit(problemas ? 1 : 0);
})().catch(e => { console.error(e); process.exit(1); });
