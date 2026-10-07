// Dados de exemplo para os testes: inventados e sempre iguais (gerador com semente fixa).
// Nunca use aqui os dados reais da loja.
'use strict';

function gerar() {
  let seed = 11; const rnd = () => (seed = (seed * 16807) % 2147483647) / 2147483647;
  const pick = a => a[Math.floor(rnd() * a.length)];
  const marcas = ['HAG', 'PD', 'GOLD', 'FM', '3F'];
  const estoque = [];
  for (let i = 0; i < 40; i++) {
    const cat = i < 28 ? 'Chave simples' : i < 36 ? 'Chave tetra' : 'Cadeado';
    estoque.push({ id: 'p' + i, cat, marca: marcas[i % marcas.length], modelo: String(600 + i), qty: 3 + (i % 9), preco: cat === 'Chave simples' ? 14 : cat === 'Chave tetra' ? 35 : 60, min: i % 4 ? 3 : 0 });
  }
  const vendas = [], despesas = []; let n = 0;
  const pays = ['dinheiro', 'pix', 'pix', 'cartao', 'cartao', 'fiado'];
  const clientes = ['Cliente Teste A', 'Cliente Teste B', 'Imobiliária Exemplo'];
  for (let d = 1; d <= 50; d++) {
    const dt = new Date(2026, 8, d); if (dt.getDay() === 0) continue; // fechado aos domingos
    const day = [dt.getFullYear(), String(dt.getMonth() + 1).padStart(2, '0'), String(dt.getDate()).padStart(2, '0')].join('-');
    if (day > '2026-10-19') break;
    for (let j = 0; j < 4; j++) {
      const items = [], r = rnd();
      if (r < .5) { const p = pick(estoque); items.push({ cat: 'estoque', pid: p.id, qty: 1, unitPrice: p.preco, desc: p.cat + ' · ' + p.marca + ' · ' + p.modelo }); }
      else if (r < .75) items.push({ cat: 'simples', qty: 1 + Math.floor(rnd() * 2), unitPrice: 14, desc: '' });
      else items.push({ cat: 'outros', qty: 1, unitPrice: 5 + Math.floor(rnd() * 40), desc: pick(['CHAVEIRO', 'CONSERTO', 'PLACA']) });
      const sub = items.reduce((s, i) => s + i.qty * i.unitPrice, 0), pay = pick(pays);
      const ts = new Date(day + 'T' + String(9 + j * 2).padStart(2, '0') + ':' + String(10 + j * 7) + ':00').getTime();
      const v = { id: ts + '-t' + (n++), day, ts, manual: false, items, subtotal: sub, discount: 0, total: sub, pay, cliente: pay === 'fiado' ? pick(clientes) : '' };
      if (pay === 'cartao') v.cartao = rnd() < .5 ? 'debito' : 'credito';
      if (pay === 'fiado' && rnd() < .6) v.recebimentos = [{ id: 'r' + n, day, ts: ts + 36e5, pay: 'pix', valor: sub }];
      vendas.push(v);
    }
    if (d % 7 === 1) despesas.push({ id: 'g' + d, day, ts: new Date(day + 'T18:00:00').getTime(), desc: 'Material de teste', cat: 'mercadoria', valor: 80 + d, manual: false });
  }
  // uma venda com pagamento dividido e uma com desconto em outubro
  const ts1 = new Date('2026-10-15T11:00:00').getTime();
  vendas.push({ id: ts1 + '-split', day: '2026-10-15', ts: ts1, manual: false, items: [{ cat: 'outros', qty: 1, unitPrice: 100, desc: 'CONSERTO' }], subtotal: 100, discount: 0, total: 100, pay: 'dinheiro', split: [{ pay: 'dinheiro', valor: 70 }, { pay: 'pix', valor: 30 }], cliente: '' });
  const ts2 = new Date('2026-10-16T10:00:00').getTime();
  vendas.push({ id: ts2 + '-desc', day: '2026-10-16', ts: ts2, manual: false, items: [{ cat: 'simples', qty: 3, unitPrice: 14, desc: '' }], subtotal: 42, discount: 2, total: 40, pay: 'pix', cliente: '' });
  // cópias de chave de carro com valores que se repetem (para as sugestões de valor)
  [['2026-09-08', 120], ['2026-09-15', 120], ['2026-09-22', 120], ['2026-10-06', 90], ['2026-10-13', 90], ['2026-10-14', 150]].forEach(([day, pr], i) => {
    const ts = new Date(day + 'T17:4' + i + ':00').getTime();
    vendas.push({ id: ts + '-carro', day, ts, manual: false, items: [{ cat: 'carro', qty: 1, unitPrice: pr, desc: '' }], subtotal: pr, discount: 0, total: pr, pay: 'pix', cliente: '' });
  });
  vendas.sort((a, b) => a.ts - b.ts);
  // uma devolução em outubro: entra no resultado do Excel do mês
  const devolvida = vendas.find(v => v.day.slice(0, 7) === '2026-10' && v.pay === 'pix');
  const extras = {
    cfg: { dias: [false, true, true, true, true, true, true], taxas: { debito: 1.5, credito: 3.5 } },
    fixos: [{ id: 'fx1', desc: 'Aluguel de teste', cat: 'aluguel', valor: 900, dia: 5 }],
    encomendas: [{ id: 'enc1', day: '2026-10-14', ts: 1, cliente: 'Cliente Teste A', desc: '10 cópias', valor: 140, sinal: 0, status: 'pendente', prazo: '2026-10-25' }],
    procuras: [{ id: 'pr1', day: '2026-10-10', ts: 1, desc: 'tetra 999' }],
    contagens: [], entradas: [], fresa: [],
    retrabalhos: [{ id: 'rt1', day: devolvida.day, ts: devolvida.ts + 6e5, tipo: 'devolucao', vendaId: devolvida.id, desc: 'Item de teste', cat: devolvida.items[0].cat, qtd: 1, chave: false, valor: Math.min(10, devolvida.total), pay: 'pix' }]
  };
  return { vendas, despesas, estoque, meta: 6000, extras };
}

module.exports = { gerar };
if (require.main === module) process.stdout.write(JSON.stringify(gerar()));
