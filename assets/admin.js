const $ = s => document.querySelector(s);
const esc = s => String(s).replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
const soma = (l, k) => l.reduce((a, v) => a + v[k], 0);
const quando = iso => new Date(iso).toLocaleString('pt-BR', { day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit' });
let visao = 'liga', parqueSel = 1;

document.querySelectorAll('[data-visao]').forEach(a => a.onclick = ev => {
  ev.preventDefault(); visao = a.dataset.visao;
  document.querySelectorAll('[data-visao]').forEach(b => b.classList.toggle('ativo', b === a)); render();
});

function kpi(l, v, destaque) { return `<div class="card kpi ${destaque ? 'destaque' : ''}"><div class="l">${l}</div><div class="v">${v}</div></div>`; }

function tabelaVendas(lista, comLiga) {
  if (!lista.length) return '<div class="vazio">Nenhuma senha vendida ainda.</div>';
  return `<div class="tabela"><table><thead><tr><th>Nº</th><th>Quando</th><th>Etapa</th><th class="hide-m">Dupla</th><th class="num">Pago</th><th class="num">Parque</th>${comLiga ? '<th class="num">Liga</th>' : ''}</tr></thead><tbody>
  ${[...lista].sort((a, b) => b.quando.localeCompare(a.quando)).slice(0, 12).map(v => { const e = LIGA.etapas.find(x => x.id === v.etapa), c = LIGA.categorias.find(x => x.id === v.categoria);
    return `<tr><td><b>${String(v.numero).padStart(4, '0')}</b>${v.origem === 'site' ? ' <span class="tag verde">nova</span>' : ''}</td><td>${quando(v.quando)}</td><td>${esc(e.cidade)}<div class="mini">${c.nome}</div></td><td class="hide-m">${esc(v.puxador)} & ${esc(v.esteireiro)}</td><td class="num">${brl(v.total)}</td><td class="num">${brl(v.parque)}</td>${comLiga ? `<td class="num"><b>${brl(v.liga)}</b></td>` : ''}</tr>`; }).join('')}
  </tbody></table></div>`;
}

function renderLiga() {
  const vs = vendas(), cfg = config();
  const atend = 37 + vs.filter(v => v.origem === 'site').length * 2;
  let h = `<div class="titulo-sec" style="margin-top:0"><h2>Olá, Cristian</h2><span class="risco"></span><span class="mini">Temporada 2026/27</span></div>
  <div class="grade g4">
    ${kpi('Sua taxa acumulada', brl(soma(vs, 'liga')), true)}
    ${kpi('Senhas vendidas', vs.length.toLocaleString('pt-BR'))}
    ${kpi('Movimentado no Pix', brl(soma(vs, 'total')))}
    ${kpi('Repassado aos parques', brl(soma(vs, 'parque')))}
  </div>

  <div class="titulo-sec"><h2>Por etapa</h2><span class="risco"></span></div>
  <div class="card tabela"><table><thead><tr><th>Etapa</th><th class="hide-m">Parque</th><th>Vendidas</th><th class="num">Repasse ao parque</th><th class="num">Sua taxa</th></tr></thead><tbody>
  ${LIGA.etapas.map(e => { const l = vs.filter(v => v.etapa === e.id), pct = Math.round(l.length / e.limite * 100);
    return `<tr><td><b>${e.id}ª · ${esc(e.cidade)}</b><div class="mini">${dataBR(e.data)}</div></td><td class="hide-m">${esc(e.parque)}</td>
    <td style="min-width:120px">${l.length}/${e.limite}<div class="barra" style="margin:4px 0 0"><i style="width:${pct}%"></i></div></td>
    <td class="num">${brl(soma(l, 'parque'))}</td><td class="num"><b>${brl(soma(l, 'liga'))}</b></td></tr>`; }).join('')}
  </tbody></table></div>

  <div class="grade g2" style="margin-top:20px">
    <div class="card"><h3>Taxa da liga</h3>
      <p class="mini">Vale para as próximas vendas. O split é configurado uma vez no banco (ex.: Asaas ou Mercado Pago) e cada parque recebe na própria conta.</p>
      <label>Valor por senha (R$)</label><input id="cfg-taxa" type="number" min="0" step="0.5" value="${cfg.taxa}">
      <label>Quem paga a taxa</label><select id="cfg-quem">
        <option value="comprador" ${cfg.quemPaga === 'comprador' ? 'selected' : ''}>O vaqueiro (somada ao preço da senha)</option>
        <option value="parque" ${cfg.quemPaga === 'parque' ? 'selected' : ''}>O parque (descontada do repasse)</option></select>
      <p class="mini" id="cfg-ex" style="margin-top:10px"></p>
      <button class="btn btn-v" id="cfg-salvar" style="margin-top:6px">Salvar</button>
    </div>
    <div class="card"><h3>Assistente de IA</h3>
      <div class="grade g2" style="margin-top:10px">${kpi('Dúvidas atendidas', atend)}${kpi('Passadas p/ equipe', Math.round(atend * .08))}</div>
      <p class="mini" style="margin-top:12px">Perguntas mais comuns: preço da senha, próxima etapa, "paguei e não chegou", troca de esteireiro. A IA responde 24h no site e no WhatsApp e só chama a equipe quando não sabe.</p>
    </div>
  </div>

  <div class="titulo-sec"><h2>Últimas senhas</h2><span class="risco"></span></div>
  <div class="card">${tabelaVendas(vs, true)}</div>
  <p style="text-align:center;margin-top:24px"><button class="btn btn-c" onclick="if(confirm('Zerar a demo e voltar aos números de exemplo?')){resetarDemo();render()}">Zerar demo</button></p>`;
  $('#painel').innerHTML = h;
  const ex = () => { const sp = calcularSplit(600, { taxa: +$('#cfg-taxa').value || 0, quemPaga: $('#cfg-quem').value });
    $('#cfg-ex').textContent = `Exemplo, senha Profissional de ${brl(600)}: vaqueiro paga ${brl(sp.total)}, parque recebe ${brl(sp.parque)}, liga fica com ${brl(sp.liga)}.`; };
  $('#cfg-taxa').oninput = ex; $('#cfg-quem').onchange = ex; ex();
  $('#cfg-salvar').onclick = () => { Store.set('config', { taxa: +$('#cfg-taxa').value || 0, quemPaga: $('#cfg-quem').value }); $('#cfg-salvar').textContent = 'Salvo ✓'; setTimeout(() => $('#cfg-salvar').textContent = 'Salvar', 1500); };
}

function renderParque() {
  const e = LIGA.etapas.find(x => x.id === parqueSel), l = vendas().filter(v => v.etapa === e.id);
  const porCat = LIGA.categorias.map(c => ({ c, n: l.filter(v => v.categoria === c.id).length }));
  $('#painel').innerHTML = `<div class="titulo-sec" style="margin-top:0"><h2>Visão do parque</h2><span class="risco"></span>
    <select id="sel-parque" style="width:auto">${LIGA.etapas.map(x => `<option value="${x.id}" ${x.id === parqueSel ? 'selected' : ''}>${esc(x.parque)}</option>`).join('')}</select></div>
  <p class="mini" style="margin-top:-6px">É o que o dono do parque vê com o login dele. Ele enxerga só as senhas da etapa dele e não vê a taxa dos outros.</p>
  <div class="grade g4">
    ${kpi('Recebido na sua conta', brl(soma(l, 'parque')), true)}
    ${kpi('Senhas vendidas', `${l.length}/${e.limite}`)}
    ${kpi('Data da etapa', dataBR(e.data))}
    ${kpi('Senhas restantes', e.limite - l.length)}
  </div>
  <div class="grade g2" style="margin-top:20px">
    <div class="card"><h3>Por categoria</h3><div class="tabela"><table><tbody>
    ${porCat.map(p => `<tr><td>${p.c.nome}</td><td style="width:50%"><div class="barra" style="margin:0"><i style="width:${l.length ? p.n / l.length * 100 : 0}%"></i></div></td><td class="num"><b>${p.n}</b></td></tr>`).join('')}
    </tbody></table></div></div>
    <div class="card"><h3>Lista da secretaria</h3><p class="mini">No dia da etapa a secretaria confere a senha pelo número ou pelo nome. Dá para imprimir ou abrir no celular.</p>
    <button class="btn btn-p" onclick="window.print()">Imprimir lista</button></div>
  </div>
  <div class="titulo-sec"><h2>Senhas da etapa</h2><span class="risco"></span></div>
  <div class="card">${tabelaVendas(l, false)}</div>`;
  $('#sel-parque').onchange = ev => { parqueSel = +ev.target.value; renderParque(); };
}

function render() { visao === 'liga' ? renderLiga() : renderParque(); }
render();
