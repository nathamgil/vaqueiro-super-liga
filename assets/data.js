// Dados de exemplo da demo. Nada aqui é real: cidades, parques, preços e nomes servem só para mostrar o fluxo.
const LIGA = {
  nome: 'Vaqueiro Super Liga',
  taxaPadrao: 4,
  etapas: [
    { id: 1, cidade: 'Feira de Santana', parque: 'Parque Etapa Feira', data: '2026-12-05', limite: 400 },
    { id: 2, cidade: 'Serrinha', parque: 'Parque Etapa Serrinha', data: '2027-01-16', limite: 350 },
    { id: 3, cidade: 'Conceição do Coité', parque: 'Parque Etapa Coité', data: '2027-02-20', limite: 350 },
    { id: 4, cidade: 'Santo Amaro', parque: 'Parque Etapa Santo Amaro', data: '2027-03-27', limite: 300 },
    { id: 5, cidade: 'Jequié', parque: 'Parque Etapa Jequié', data: '2027-04-24', limite: 300 },
    { id: 6, cidade: 'Irecê', parque: 'Parque Etapa Irecê', data: '2027-05-22', limite: 300 },
    { id: 7, cidade: 'Vitória da Conquista', parque: 'Parque Etapa Conquista', data: '2027-06-19', limite: 350 },
    { id: 8, cidade: 'Barreiras', parque: 'Parque Etapa Barreiras', data: '2027-07-17', limite: 300 }
  ],
  categorias: [
    { id: 'pro', nome: 'Profissional', preco: 600 },
    { id: 'ama', nome: 'Amador', preco: 350 },
    { id: 'asp', nome: 'Aspirante', preco: 250 },
    { id: 'fem', nome: 'Feminino', preco: 200 },
    { id: 'jov', nome: 'Jovem', preco: 150 }
  ]
};

const VAQUEIROS_INICIAIS = [
  { id: 'v1', nome: 'Cristian Bell', funcao: 'Puxador', cidade: 'Tanquinho/BA' },
  { id: 'v2', nome: 'Zé Lourenço', funcao: 'Esteireiro', cidade: 'Feira de Santana/BA' },
  { id: 'v3', nome: 'Toinho do Aboio', funcao: 'Puxador', cidade: 'Serrinha/BA' },
  { id: 'v4', nome: 'Neném Vaqueiro', funcao: 'Esteireiro', cidade: 'Riachão do Jacuípe/BA' }
];

const brl = v => v.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
const dataBR = s => new Date(s + 'T12:00:00').toLocaleDateString('pt-BR', { day: '2-digit', month: 'short', year: 'numeric' }).replace('.', '');

// Armazenamento local: a demo guarda tudo no navegador para o site e o painel conversarem.
const Store = {
  get(k, def) { try { const v = localStorage.getItem('vsl_' + k); return v ? JSON.parse(v) : def; } catch (e) { return def; } },
  set(k, v) { try { localStorage.setItem('vsl_' + k, JSON.stringify(v)); } catch (e) {} }
};

function config() { return Store.get('config', { taxa: LIGA.taxaPadrao, quemPaga: 'comprador' }); }

// Split: quanto vai para o parque e quanto fica com a liga em cada senha.
function calcularSplit(preco, cfg = config()) {
  if (cfg.quemPaga === 'comprador') return { total: preco + cfg.taxa, parque: preco, liga: cfg.taxa };
  return { total: preco, parque: preco - cfg.taxa, liga: cfg.taxa };
}

// Vendas semeadas (sempre as mesmas) para o painel não abrir vazio.
function vendasSemente() {
  let s = 7; const rnd = () => (s = (s * 9301 + 49297) % 233280) / 233280;
  const nomes = ['Júnior Gado Bravo', 'Fabinho Vaqueiro', 'Raí do Sertão', 'Tiago Boiadeiro', 'Gil Aboiador', 'Marquinhos BA', 'Duda Vaqueira', 'Léo Mourão', 'Pedrinho Pega-Boi', 'Rafa Esteira', 'Vitinho Coité', 'Lucas do Haras'];
  const pesos = { 1: 168, 2: 121, 3: 64, 4: 22 };
  const out = []; let n = 1;
  for (const [etapa, qtd] of Object.entries(pesos)) {
    for (let i = 0; i < qtd; i++) {
      const r = rnd(), cat = LIGA.categorias[r < .18 ? 0 : r < .52 ? 1 : r < .76 ? 2 : r < .9 ? 3 : 4];
      const sp = calcularSplit(cat.preco, { taxa: 4, quemPaga: 'comprador' });
      out.push({
        numero: n++, etapa: +etapa, categoria: cat.id,
        puxador: nomes[Math.floor(rnd() * nomes.length)], esteireiro: nomes[Math.floor(rnd() * nomes.length)],
        total: sp.total, parque: sp.parque, liga: sp.liga,
        quando: new Date(Date.now() - rnd() * 20 * 864e5).toISOString(), origem: 'semente'
      });
    }
  }
  return out;
}

function vendas() {
  let v = Store.get('vendas', null);
  if (!v) { v = vendasSemente(); Store.set('vendas', v); }
  return v;
}
function salvarVenda(venda) { const v = vendas(); venda.numero = v.length + 1; v.push(venda); Store.set('vendas', v); return venda; }
function vaqueiros() { return Store.get('vaqueiros', VAQUEIROS_INICIAIS); }
function salvarVaqueiros(l) { Store.set('vaqueiros', l); }
function resetarDemo() { ['vendas', 'vaqueiros', 'config', 'minhas'].forEach(k => { try { localStorage.removeItem('vsl_' + k); } catch (e) {} }); }
