document.addEventListener('DOMContentLoaded', () => {
    const filtro = document.getElementById('filtroStatusHistorico');
    if (filtro) filtro.addEventListener('change', carregarHistorico);
    carregarHistorico();
});

async function carregarHistorico() {
    const tbody = document.getElementById('listaHistoricoGeral');
    const usuario = JSON.parse(localStorage.getItem('usuario') || '{}');
    const admin = usuario.perfil === 'admin';
    const filtro = document.getElementById('filtroStatusHistorico');
    document.querySelectorAll('.admin-only').forEach(el => { el.style.display = admin ? '' : 'none'; });
    if (filtro) filtro.style.display = admin ? '' : 'none';
    try {
        const token = localStorage.getItem('token');
        const status = admin && filtro && filtro.value === 'bloqueados' ? '?status=bloqueados' : '';
        const res = await fetch('/api/conferencias/historico-geral' + status, { headers: { 'Authorization': 'Bearer ' + token } });
        if (!res.ok) { tbody.innerHTML = '<tr><td colspan="8">Erro ao acessar o histórico.</td></tr>'; return; }
        const pacotes = await res.json();
        tbody.innerHTML = '';
        if (!Array.isArray(pacotes) || pacotes.length === 0) { tbody.innerHTML = '<tr><td colspan="8">Nenhum pedido encontrado.</td></tr>'; return; }
        pacotes.forEach(p => {
            const data = p.data_conferido ? new Date(p.data_conferido).toLocaleString('pt-BR') : '-';
            const nomes = { ok: 'OK', liberado_divergente: 'LIBERADO COM DIVERGÊNCIA', divergente_peso: 'DIVERGÊNCIA DE PESO', bloqueado: 'BLOQUEADO - AGUARDANDO APROVAÇÃO', bloqueado_aprovacao: 'BLOQUEADO - AGUARDANDO APROVAÇÃO', cancelado: 'CANCELADO', pendente: 'PENDENTE' };
            const acoes = admin && ['bloqueado', 'bloqueado_aprovacao'].includes(p.status)
                ? '<button type="button" onclick="abrirAcoesHistorico(' + p.id + ')">Reabrir análise</button><div id="acoes-historico-' + p.id + '" style="display:none"><button type="button" onclick="decidirPacoteHistorico(' + p.id + ', \'aprovar\')">Aprovar</button> <button type="button" onclick="decidirPacoteHistorico(' + p.id + ', \'cancelar\')">Cancelar pedido</button></div>'
                : (admin ? '-' : '');
            const tr = document.createElement('tr');
            [data, p.numero_nf || '-', p.razao_social || '-', p.conferencia?.transportadora || 'Desconhecida', nomes[p.status] || String(p.status).toUpperCase(), p.peso_lido_g == null ? '-' : p.peso_lido_g + 'g', p.justificativa_liberacao || '-', acoes].forEach((valor, i) => {
                const td = document.createElement('td');
                if (i === 7 && admin) td.innerHTML = valor; else td.textContent = valor;
                tr.appendChild(td);
            });
            if (!admin) tr.lastElementChild.style.display = 'none';
            tbody.appendChild(tr);
        });
    } catch (err) { console.error('Erro ao carregar histórico', err); tbody.innerHTML = '<tr><td colspan="8">Falha de ligação ao servidor.</td></tr>'; }
}

async function decidirPacoteHistorico(id, decisao) {
    const aprovacao = decisao === 'aprovar';
    const justificativa = window.prompt(aprovacao ? 'Justificativa para aprovar o envio com divergência:' : 'Motivo do cancelamento deste pedido:');
    if (!justificativa || !justificativa.trim()) return;
    try {
        const endpoint = aprovacao ? 'aprovar-bloqueado' : 'cancelar-bloqueado';
        const res = await fetch('/api/conferencias/pacotes/' + id + '/' + endpoint, { method: 'POST', headers: { 'Content-Type': 'application/json', 'Authorization': 'Bearer ' + localStorage.getItem('token') }, body: JSON.stringify({ justificativa: justificativa.trim() }) });
        const dados = await res.json();
        if (!res.ok) { alert(dados.erro || 'Não foi possível atualizar o pedido.'); return; }
        alert(dados.mensagem);
        carregarHistorico();
    } catch { alert('Falha de ligação à API.'); }
}

function abrirAcoesHistorico(id) { const el = document.getElementById('acoes-historico-' + id); if (el) el.style.display = 'block'; }
