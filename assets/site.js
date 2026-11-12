const $ = s => document.querySelector(s);
const esc = s => String(s).replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));

function vendidasPorEtapa(id) { return vendas().filter(v => v.etapa === id).length; }

function renderEtapas() {
  $('#lista-etapas').innerHTML = LIGA.etapas.map(e => {
    const vend = vendidasPorEtapa(e.id), pct = Math.min(100, Math.round(vend / e.limite * 100));
    const restam = e.limite - vend;
    return `<div class="card etapa">
      <div class="n">${e.id}ª etapa · ${dataBR(e.data)}</div>
      <h3>${esc(e.cidade)}</h3>
      <div class="p">${esc(e.parque)}</div>
      <div class="barra"><i style="width:${pct}%"></i></div>
      <div class="mini">${vend} de ${e.limite} senhas vendidas</div>
      <div style="margin-top:8px">${restam < 60 ? '<span class="tag vermelha">Últimas senhas</span>' : '<span class="tag verde">Vendas abertas</span>'}</div>
    </div>`;
  }).join('');
}

// ---------- abas da conta ----------
let abaAtual = 'comprar';
function irPara(aba) { abaAtual = aba; document.querySelectorAll('.menu-conta button').forEach(b => b.classList.toggle('ativo', b.dataset.aba === aba)); render(); }
document.querySelectorAll('.menu-conta button').forEach(b => b.onclick = () => irPara(b.dataset.aba));

function render() {
  if (abaAtual === 'comprar') renderCompra();
  if (abaAtual === 'vaqueiros') renderVaqueiros();
  if (abaAtual === 'senhas') renderSenhas();
}

// ---------- compra ----------
let pedido = { passo: 1 };
const PASSOS = ['Etapa', 'Categoria', 'Dupla', 'Pagamento', 'Senha'];

function cabecalhoPassos() {
  return `<div class="passos">${PASSOS.map((p, i) => `<span class="${i + 1 < pedido.passo ? 'ok' : i + 1 === pedido.passo ? 'on' : ''}">${i + 1}. ${p}</span>`).join('')}</div>`;
}

function blocoSplit(preco) {
  const sp = calcularSplit(preco), cfg = config();
  const pp = sp.parque / sp.total * 100;
  const etapa = LIGA.etapas.find(e => e.id === pedido.etapa);
  return `<div class="split">
    <div class="cond" style="font-size:15px;margin-bottom:6px">Para onde vai o dinheiro</div>
    <div class="barra2"><i style="width:${pp}%;background:var(--couro)"></i><i style="flex:1;background:var(--vermelho)"></i></div>
    <div class="linha"><span>🏟️ ${esc(etapa ? etapa.parque : 'Parque')}</span><b>${brl(sp.parque)}</b></div>
    <div class="linha"><span>★ Taxa da Super Liga ${cfg.quemPaga === 'comprador' ? '(somada ao preço)' : '(descontada do parque)'}</span><b>${brl(sp.liga)}</b></div>
    <div class="linha total"><span>Você paga</span><span>${brl(sp.total)}</span></div>
    <div class="mini">A divisão é feita pelo próprio banco no momento do Pix. Ninguém precisa repassar nada à mão.</div>
  </div>`;
}

function renderCompra() {
  const el = $('#aba'); let h = cabecalhoPassos();
  if (pedido.passo === 1) {
    h += `<div class="card"><h3>Escolha a etapa</h3><p class="mini">Só aparecem as etapas com senha disponível.</p><div class="opcoes">` +
      LIGA.etapas.map(e => {
        const rest = e.limite - vendidasPorEtapa(e.id);
        return `<button class="opcao ${pedido.etapa === e.id ? 'sel' : ''}" onclick="pedido.etapa=${e.id};pedido.passo=2;render()"><span class="mini">${e.id}ª · ${dataBR(e.data)}</span><b>${esc(e.cidade)}</b><span class="mini">${rest} senhas restantes</span></button>`;
      }).join('') + `</div></div>`;
  }
  if (pedido.passo === 2) {
    h += `<div class="card"><h3>Categoria</h3><div class="opcoes" style="margin-top:12px">` +
      LIGA.categorias.map(c => `<button class="opcao ${pedido.categoria === c.id ? 'sel' : ''}" onclick="pedido.categoria='${c.id}';pedido.passo=3;render()"><b>${c.nome}</b><span>${brl(c.preco)}</span></button>`).join('') +
      `</div><p style="margin-top:16px"><button class="btn btn-c" onclick="pedido.passo=1;render()">Voltar</button></p></div>`;
  }
  if (pedido.passo === 3) {
    const vq = vaqueiros(); const cat = LIGA.categorias.find(c => c.id === pedido.categoria);
    const op = f => vq.map(v => `<option value="${v.id}" ${pedido[f] === v.id ? 'selected' : ''}>${esc(v.nome)} — ${v.funcao}</option>`).join('');
    h += `<div class="grade g2"><div class="card"><h3>Monte a dupla</h3>
      <p class="mini">Os vaqueiros da sua equipe já vêm cadastrados. Na hora da compra é só escolher.</p>
      <label>Puxador</label><select id="pux">${op('puxador')}</select>
      <label>Esteireiro</label><select id="est">${op('esteireiro')}</select>
      <label>Cavalo (opcional)</label><input id="cav" placeholder="Nome do cavalo" value="${esc(pedido.cavalo || '')}">
      <p class="mini" style="margin-top:10px">Faltou alguém? <a href="#conta" onclick="irPara('vaqueiros');return false">Cadastrar vaqueiro</a></p>
      <p style="display:flex;gap:8px;margin-top:16px;flex-wrap:wrap"><button class="btn btn-c" onclick="pedido.passo=2;render()">Voltar</button><button class="btn btn-v" onclick="confirmarDupla()">Ir para pagamento</button></p>
      </div>${blocoSplit(cat.preco)}</div>`;
    el.innerHTML = h;
    if (!pedido.puxador) $('#pux').value = (vq.find(v => v.funcao === 'Puxador') || vq[0]).id;
    if (!pedido.esteireiro) $('#est').value = (vq.find(v => v.funcao === 'Esteireiro') || vq[0]).id;
    return;
  }
  if (pedido.passo === 4) {
    const cat = LIGA.categorias.find(c => c.id === pedido.categoria), sp = calcularSplit(cat.preco);
    h += `<div class="grade g2"><div class="card"><h3>Pague com Pix</h3>
      <div class="pix" style="margin-top:12px"><canvas id="qr" width="29" height="29"></canvas>
      <div><div class="cond" style="font-size:30px">${brl(sp.total)}</div><p class="mini">Abra o app do banco, escolha Pix e leia o código. A senha é liberada assim que o pagamento cair.</p>
      <div class="codigo">00020126580014BR.GOV.BCB.PIX0136demo-superliga-${pedido.etapa}${pedido.categoria}520400005303986540${sp.total.toFixed(2)}5802BR</div></div></div>
      <p class="mini" style="margin-top:12px">⏳ Aguardando pagamento…</p>
      <p style="display:flex;gap:8px;flex-wrap:wrap"><button class="btn btn-c" onclick="pedido.passo=3;render()">Voltar</button><button class="btn btn-v" onclick="pagar()">Simular Pix pago</button></p>
      </div>${blocoSplit(cat.preco)}</div>`;
    el.innerHTML = h; desenharQR($('#qr'), pedido.etapa * 31 + cat.preco); return;
  }
  if (pedido.passo === 5) {
    const v = pedido.venda, e = LIGA.etapas.find(x => x.id === v.etapa), cat = LIGA.categorias.find(c => c.id === v.categoria);
    h += `<div class="grade g2"><div class="ticket">
      <div class="cond" style="font-size:14px;color:#C9BBA5">Senha confirmada</div>
      <div class="num">Nº ${String(v.numero).padStart(4, '0')}</div>
      <p style="margin:12px 0 4px"><b>${e.id}ª etapa · ${esc(e.cidade)}</b> · ${dataBR(e.data)}</p>
      <p style="margin:0">${cat.nome} · ${esc(v.puxador)} & ${esc(v.esteireiro)}${v.cavalo ? ' · 🐎 ' + esc(v.cavalo) : ''}</p>
      <p class="mini" style="color:#C9BBA5;margin-top:14px">Comprovante enviado no WhatsApp cadastrado. Apresente o número na secretaria do parque.</p>
      </div><div class="split">
      <div class="cond" style="font-size:15px;margin-bottom:6px">✅ Split feito pelo banco</div>
      <div class="linha"><span>Caiu na conta do ${esc(e.parque)}</span><b>${brl(v.parque)}</b></div>
      <div class="linha"><span>Caiu na conta da Super Liga</span><b>${brl(v.liga)}</b></div>
      <div class="linha total"><span>Total pago</span><span>${brl(v.total)}</span></div>
      <p style="display:flex;gap:8px;flex-wrap:wrap;margin-top:12px"><button class="btn btn-v" onclick="pedido={passo:1};render()">Comprar outra</button><a class="btn btn-c" href="admin.html">Ver no painel</a></p>
      </div></div>`;
  }
  el.innerHTML = h;
}

function confirmarDupla() {
  pedido.puxador = $('#pux').value; pedido.esteireiro = $('#est').value; pedido.cavalo = $('#cav').value.trim();
  if (pedido.puxador === pedido.esteireiro) { alert('Escolha duas pessoas diferentes para a dupla.'); return; }
  pedido.passo = 4; render();
}

function pagar() {
  const cat = LIGA.categorias.find(c => c.id === pedido.categoria), sp = calcularSplit(cat.preco), vq = vaqueiros();
  const nome = id => (vq.find(v => v.id === id) || {}).nome || '';
  const venda = salvarVenda({ etapa: pedido.etapa, categoria: cat.id, puxador: nome(pedido.puxador), esteireiro: nome(pedido.esteireiro), cavalo: pedido.cavalo, total: sp.total, parque: sp.parque, liga: sp.liga, quando: new Date().toISOString(), origem: 'site' });
  const minhas = Store.get('minhas', []); minhas.push(venda.numero); Store.set('minhas', minhas);
  pedido = { passo: 5, venda }; renderEtapas(); render();
}

function desenharQR(cv, seed) {
  const c = cv.getContext('2d'), n = 29; let s = seed;
  const r = () => (s = (s * 9301 + 49297) % 233280) / 233280;
  c.fillStyle = '#fff'; c.fillRect(0, 0, n, n); c.fillStyle = '#17130F';
  for (let y = 0; y < n; y++) for (let x = 0; x < n; x++) if (r() > .52) c.fillRect(x, y, 1, 1);
  const olho = (x, y) => { c.fillStyle = '#17130F'; c.fillRect(x, y, 7, 7); c.fillStyle = '#fff'; c.fillRect(x + 1, y + 1, 5, 5); c.fillStyle = '#17130F'; c.fillRect(x + 2, y + 2, 3, 3); };
  c.fillStyle = '#fff'; c.fillRect(0, 0, 8, 8); c.fillRect(n - 8, 0, 8, 8); c.fillRect(0, n - 8, 8, 8);
  olho(0, 0); olho(n - 7, 0); olho(0, n - 7);
}

// ---------- vaqueiros ----------
function renderVaqueiros() {
  const vq = vaqueiros();
  $('#aba').innerHTML = `<div class="card"><h3>Meus vaqueiros</h3>
    <p class="mini">Cadastre os vaqueiros da sua equipe uma vez só. Na hora da compra é só escolher o nome.</p>
    <div class="tabela"><table><thead><tr><th>Nome</th><th>Função</th><th class="hide-m">Cidade</th><th></th></tr></thead><tbody>
    ${vq.map(v => `<tr><td><b>${esc(v.nome)}</b></td><td>${v.funcao}</td><td class="hide-m">${esc(v.cidade)}</td><td class="num"><button class="btn btn-c" style="padding:4px 10px;font-size:13px" onclick="removerVaqueiro('${v.id}')">Remover</button></td></tr>`).join('')}
    </tbody></table></div>
    <form id="novo" class="grade g3" style="margin-top:16px;align-items:end">
      <div><label>Nome</label><input id="nv-nome" required placeholder="Ex.: Júnior Gado Bravo"></div>
      <div><label>Função</label><select id="nv-func"><option>Puxador</option><option>Esteireiro</option></select></div>
      <div><label>Cidade</label><input id="nv-cid" placeholder="Cidade/UF"></div>
      <div><button class="btn btn-v" style="width:100%">Adicionar vaqueiro</button></div>
    </form></div>`;
  $('#novo').onsubmit = ev => {
    ev.preventDefault(); const l = vaqueiros();
    l.push({ id: 'v' + Date.now(), nome: $('#nv-nome').value.trim(), funcao: $('#nv-func').value, cidade: $('#nv-cid').value.trim() || '—' });
    salvarVaqueiros(l); renderVaqueiros();
  };
}
function removerVaqueiro(id) { salvarVaqueiros(vaqueiros().filter(v => v.id !== id)); renderVaqueiros(); }

// ---------- minhas senhas ----------
function renderSenhas() {
  const minhas = Store.get('minhas', []), lista = vendas().filter(v => minhas.includes(v.numero)).reverse();
  $('#aba').innerHTML = `<div class="card"><h3>Minhas senhas</h3>${lista.length ? `<div class="tabela"><table><thead><tr><th>Nº</th><th>Etapa</th><th>Dupla</th><th class="num">Valor</th></tr></thead><tbody>
    ${lista.map(v => { const e = LIGA.etapas.find(x => x.id === v.etapa); const c = LIGA.categorias.find(x => x.id === v.categoria);
      return `<tr><td><b>${String(v.numero).padStart(4, '0')}</b></td><td>${esc(e.cidade)}<div class="mini">${c.nome} · ${dataBR(e.data)}</div></td><td>${esc(v.puxador)} & ${esc(v.esteireiro)}</td><td class="num">${brl(v.total)}</td></tr>`; }).join('')}
    </tbody></table></div>` : `<div class="vazio">Você ainda não comprou senha nesta demo.<br><br><button class="btn btn-v" onclick="irPara('comprar')">Comprar a primeira</button></div>`}</div>`;
}

// ---------- assistente IA (simulado) ----------
const chat = $('#chat'), msgs = $('#msgs');
$('#chat-bt').onclick = () => { chat.classList.toggle('aberto'); if (!msgs.children.length) boasVindas(); };
function falar(txt, quem = 'ia') { const d = document.createElement('div'); d.className = 'msg ' + quem; d.textContent = txt; msgs.appendChild(d); msgs.scrollTop = msgs.scrollHeight; }
function sugestoes(l) { $('#sugs').innerHTML = l.map(s => `<button type="button">${s}</button>`).join(''); $('#sugs').querySelectorAll('button').forEach(b => b.onclick = () => perguntar(b.textContent)); }
function boasVindas() {
  falar('Fala, vaqueiro! Sou o assistente da Super Liga. Posso te ajudar com senha, preço, próxima etapa ou pagamento.');
  sugestoes(['Quanto custa a senha?', 'Qual a próxima etapa?', 'Paguei e não chegou', 'Posso trocar o esteireiro?']);
}
function responder(p) {
  const t = p.toLowerCase(); const prox = LIGA.etapas[0];
  if (/(pre[cç]o|quanto|valor|custa)/.test(t)) return 'Os valores desta temporada (exemplo):\n' + LIGA.categorias.map(c => `• ${c.nome}: ${brl(calcularSplit(c.preco).total)}`).join('\n') + '\n\nJá inclui a taxa da liga. Quer comprar agora?';
  if (/(pr[oó]xim|etapa|quando|data|calend)/.test(t)) { const r = prox.limite - vendidasPorEtapa(prox.id); return `A próxima é a ${prox.id}ª etapa em ${prox.cidade}, dia ${dataBR(prox.data)}, no ${prox.parque}. Restam ${r} senhas.`; }
  if (/(pagu|n[aã]o cheg|caiu|pix|comprovante)/.test(t)) return 'Calma que a gente resolve! O Pix costuma confirmar em segundos. Me manda o número do pedido ou o CPF de quem pagou que eu confiro aqui. Se tiver caído, libero sua senha na hora. Se não, te mando um novo código.';
  if (/(troc|mudar|substitu|esteireiro|puxador)/.test(t)) return 'Pode trocar até 24h antes da etapa, sem custo. Vá em Minha conta → Minhas senhas, ou me diga o número da senha e o nome do novo vaqueiro que eu faço pra você.';
  if (/(cancel|reembols|devol)/.test(t)) return 'O reembolso segue o regulamento da etapa. Vou abrir um chamado e o organizador responde em até 24h. Pode me passar o número da senha?';
  if (/(regulament|regra|categoria)/.test(t)) return 'Temos as categorias ' + LIGA.categorias.map(c => c.nome).join(', ') + '. O regulamento completo de cada etapa fica no site. Quer que eu te mande o link no WhatsApp?';
  if (/(oi|ol[aá]|bom dia|boa tarde|boa noite|e a[ií])/.test(t)) return 'Opa! Em que posso ajudar?';
  return 'Não tenho certeza dessa. Vou passar sua pergunta pra equipe da liga e te respondem no WhatsApp. Enquanto isso, quer saber preço ou próxima etapa?';
}
function perguntar(p) { if (!p.trim()) return; falar(p, 'eu'); setTimeout(() => falar(responder(p)), 450); }
$('#chat-form').onsubmit = ev => { ev.preventDefault(); perguntar($('#chat-in').value); $('#chat-in').value = ''; };

renderEtapas(); render();
