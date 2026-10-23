// script.js - Gestão de Conferência com API MySQL e Balança

let conferenciaAtual = null;
let caixaAtiva = null;
let filtroAtivo = false;
let filtroTermo = '';

const API_BASE = 'http://localhost:3000/api';

function obterTokenAtual() {
    return localStorage.getItem('token') || (typeof window.token !== 'undefined' ? window.token : '');
}

function obterUsuarioAtual() {
    try {
        return JSON.parse(localStorage.getItem('usuario') || (typeof window.usuarioLogado !== 'undefined' ? JSON.stringify(window.usuarioLogado) : '{}'));
    } catch {
        return {};
    }
}

document.addEventListener('DOMContentLoaded', () => {
    aplicarPermissoesPerfil();
    carregarConferenciasAtivas();
    iniciarMonitoramentoBalanca();

    const inputCodigo = document.getElementById('codigoInput');
    if (inputCodigo) {
        inputCodigo.addEventListener('keypress', (e) => {
            if (e.key === 'Enter') {
                e.preventDefault();
                processarBipagem(e.target.value.trim());
            }
        });
    }

    const filtro = document.getElementById('filtroNf');
    if (filtro) {
        filtro.addEventListener('input', (e) => {
            filtroTermo = e.target.value.trim().toLowerCase();
            renderizarTabela();
        });
    }
});

function aplicarPermissoesPerfil() {
    const user = obterUsuarioAtual();
    const elementosAdmin = document.querySelectorAll('.admin-only');
    elementosAdmin.forEach(el => {
        el.style.display = user.perfil === 'admin' ? '' : 'none';
    });
}

function iniciarMonitoramentoBalanca() {
    setInterval(async () => {
        try {
            const simulador = document.getElementById('simuladorPeso');
            if (simulador && simulador.value !== '') {
                document.getElementById('displayPesoBalanca').textContent = `${Number(simulador.value).toFixed(2)} g`;
                return;
            }

            const res = await fetch(`${API_BASE}/balanca/peso`);
            if (res.ok) {
                const dados = await res.json();
                const display = document.getElementById('displayPesoBalanca');
                if (display) {
                    display.textContent = `${Number(dados.peso_gramas).toFixed(2)} g`;
                }
            }
        } catch {
            // Balança offline
        }
    }, 1500);
}

// 1. BIPAGEM
async function processarBipagem(codigo) {
    if (!codigo) return;
    const input = document.getElementById('codigoInput');

    if (!conferenciaAtual) {
        mostrarMensagem("Nenhuma conferência selecionada. Importe um JSON ou retome uma conferência.", "warning");
        aplicarEfeitoVisual("error");
        input.value = '';
        return;
    }

    // 1º Bipe: Caixa
    if (!caixaAtiva) {
        try {
            const resCaixas = await fetch(`${API_BASE}/parametrizacao/caixas`, {
                headers: { 'Authorization': `Bearer ${obterTokenAtual()}` }
            });
            const caixas = await resCaixas.json();
            if (Array.isArray(caixas)) {
                const caixaEncontrada = caixas.find(c => String(c.codigo_sku).toUpperCase() === codigo.toUpperCase());

                if (caixaEncontrada) {
                    caixaAtiva = caixaEncontrada;
                    document.getElementById('displayCaixaAtiva').textContent = `${caixaAtiva.codigo_sku} - ${caixaAtiva.nome}`;
                    document.getElementById('displayPesoTara').textContent = `Tara: ${Number(caixaAtiva.peso_gramas).toFixed(2)}g`;
                    document.getElementById('btnCancelarCaixa').style.display = 'inline-block';

                    aplicarEfeitoVisual("ok");
                    mostrarMensagem(`Caixa ${caixaAtiva.nome} identificada. Agora bipe a NF ou Chave de Acesso.`, "info");
                    input.value = '';
                    input.placeholder = "2º Bipe: NF ou Chave de Acesso do pacote";
                    return;
                }
            }
        } catch (err) {
            console.error(err);
        }
    }

    // 2º Bipe: Pacote
    if (!caixaAtiva) {
        mostrarMensagem("Bipe primeiro o código/SKU da caixa antes do pacote!", "warning");
        aplicarEfeitoVisual("error");
        input.value = '';
        return;
    }

    const simulador = document.getElementById('simuladorPeso');
    const pesoManual = simulador && simulador.value !== '' ? Number(simulador.value) : undefined;

    try {
        const res = await fetch(`${API_BASE}/conferencias/conferir`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${obterTokenAtual()}`
            },
            body: JSON.stringify({
                conferencia_id: conferenciaAtual.id,
                codigo_caixa: caixaAtiva.codigo_sku,
                codigo_pacote: codigo,
                peso_balanca: pesoManual
            })
        });

        const resposta = await res.json();

        if (res.status === 200) {
            if (resposta.pacote.possui_guia_icms) {
                aplicarEfeitoVisual("guide-required");
                mostrarMensagem(`Aprovado! UF exige GUIA DIFAL colada na caixa (NF ${resposta.pacote.numero_nf}).`, "info");
            } else {
                aplicarEfeitoVisual("ok");
                mostrarMensagem(`Pacote NF ${resposta.pacote.numero_nf} conferido com sucesso!`, "success");
            }
            cancelarCaixaAtiva();
            await recarregarConferenciaAtual();
        } else if (res.status === 409) {
            aplicarEfeitoVisual("duplicate");
            abrirModalDuplicado(resposta.pacote);
        } else if (res.status === 422) {
            aplicarEfeitoVisual("error");
            if (resposta.status === 'bloqueado') {
                abrirModalBloqueio(codigo, resposta.detalhes);
            } else {
                abrirModalDivergencia(codigo, resposta.detalhes);
            }
        } else if (res.status === 404) {
            aplicarEfeitoVisual("error");
            mostrarMensagem("DIVERGÊNCIA: Pacote não pertence a esta remessa/conferência!", "error");
        } else {
            aplicarEfeitoVisual("error");
            mostrarMensagem(resposta.erro || "Erro na validação do pacote.", "error");
        }
    } catch {
        mostrarMensagem("Falha de conexão com a API.", "error");
    } finally {
        input.value = '';
        input.focus();
    }
}

function cancelarCaixaAtiva() {
    caixaAtiva = null;
    document.getElementById('displayCaixaAtiva').textContent = "Aguardando bipagem...";
    document.getElementById('displayPesoTara').textContent = "Tara: 0.00g";
    document.getElementById('btnCancelarCaixa').style.display = 'none';
    document.getElementById('codigoInput').placeholder = "1º Bipe: Caixa (Barcode) | 2º Bipe: NF ou Chave de Acesso";
}

// 2. IMPORTAÇÃO DO JSON
async function handleFileImport(event) {
    const file = event.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = async (e) => {
        try {
            const data = JSON.parse(e.target.result);
            const res = await fetch(`${API_BASE}/conferencias/importar`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${obterTokenAtual()}`
                },
                body: JSON.stringify({
                    arquivo_nome: file.name,
                    pacotes: data
                })
            });

            const resultado = await res.json();
            if (!res.ok) {
                mostrarMensagem(resultado.erro || "Erro ao importar remessa.", "error");
                return;
            }

            mostrarMensagem(`${resultado.mensagem} Novos: ${resultado.pacotes_adicionados}, Duplicados ignorados: ${resultado.pacotes_duplicados}`, "success");
            await carregarConferenciasAtivas(resultado.conferencia_id);
        } catch {
            mostrarMensagem("Erro ao processar o arquivo JSON.", "error");
        } finally {
            document.getElementById('jsonInput').value = '';
        }
    };
    reader.readAsText(file);
}

// 3. CONFERÊNCIAS ATIVAS E RETOMADA
async function carregarConferenciasAtivas(selecionarId = null) {
    try {
        const res = await fetch(`${API_BASE}/conferencias/ativas`, {
            headers: { 'Authorization': `Bearer ${obterTokenAtual()}` }
        });
        
        if (!res.ok) {
            const erroData = await res.json().catch(() => ({}));
            mostrarMensagem(erroData.erro || "Erro ao carregar lista de conferências.", "error");
            return;
        }

        const conferencias = await res.json();
        const select = document.getElementById('selectConferencia');
        select.innerHTML = '';

        if (!Array.isArray(conferencias) || conferencias.length === 0) {
            select.innerHTML = '<option value="">Nenhuma conferência em andamento</option>';
            atualizarListaHistorico([]);
            return;
        }

        conferencias.forEach(c => {
            const total = c.pacotes?.length || 0;
            const pendentes = c.pacotes?.filter(p => p.status !== 'ok' && p.status !== 'liberado_divergente').length || 0;
            select.innerHTML += `<option value="${c.id}">${c.transportadora} - ${c.status.toUpperCase()} (${pendentes} restantes de ${total})</option>`;
        });

        atualizarListaHistorico(conferencias);

        if (selecionarId) {
            select.value = selecionarId;
            await carregarDetalhesConferencia(selecionarId);
        } else if (!conferenciaAtual && conferencias.length > 0) {
            select.value = conferencias[0].id;
            await carregarDetalhesConferencia(conferencias[0].id);
        }
    } catch {
        mostrarMensagem("Erro de conexão ao carregar conferências.", "error");
    }
}

async function retomarConferencia() {
    const select = document.getElementById('selectConferencia');
    const id = select ? select.value : null;

    if (!id) {
        mostrarMensagem("Selecione uma conferência para retomar.", "warning");
        return;
    }

    try {
        const res = await fetch(`${API_BASE}/conferencias/${id}/retomar`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${obterTokenAtual()}`
            }
        });

        const dados = await res.json();
        if (!res.ok) {
            mostrarMensagem(dados.erro || "Erro ao retomar conferência.", "error");
            return;
        }

        mostrarMensagem("Conferência retomada com sucesso!", "success");
        await carregarDetalhesConferencia(id);
        await carregarConferenciasAtivas(id);
    } catch {
        mostrarMensagem("Falha de conexão ao retomar conferência.", "error");
    }
}

async function carregarDetalhesConferencia(id) {
    if (!id) return;
    try {
        const res = await fetch(`${API_BASE}/conferencias/${id}`, {
            headers: { 'Authorization': `Bearer ${obterTokenAtual()}` }
        });
        
        if (!res.ok) {
            const erroData = await res.json().catch(() => ({}));
            mostrarMensagem(erroData.erro || "Erro ao buscar conferência.", "error");
            return;
        }

        conferenciaAtual = await res.json();

        document.getElementById('transportadoraAtual').textContent = `Transportadora: ${conferenciaAtual.transportadora}`;
        document.getElementById('btnInterromper').disabled = false;
        document.getElementById('btnFinalizar').disabled = false;
        document.getElementById('btnResetRemessa').disabled = false;
        document.getElementById('btnExcluirPacotes').disabled = false;

        renderizarTabela();
        atualizarContadores();
        cancelarCaixaAtiva();
    } catch {
        mostrarMensagem("Erro ao carregar dados da conferência.", "error");
    }
}

async function recarregarConferenciaAtual() {
    if (conferenciaAtual) {
        await carregarDetalhesConferencia(conferenciaAtual.id);
    }
}

// 4. TABELA E CONTADORES
function renderizarTabela() {
    const tbody = document.getElementById('listaPacotes');
    tbody.innerHTML = '';

    if (!conferenciaAtual || !conferenciaAtual.pacotes || conferenciaAtual.pacotes.length === 0) {
        tbody.innerHTML = '<tr><td colspan="11" style="text-align: center;">Nenhum pacote carregado nesta conferência.</td></tr>';
        return;
    }

    let pacotes = conferenciaAtual.pacotes;

    if (filtroAtivo) {
        pacotes = pacotes.filter(p => p.status !== 'ok' && p.status !== 'liberado_divergente');
    }

    if (filtroTermo) {
        pacotes = pacotes.filter(p =>
            String(p.numero_nf).toLowerCase().includes(filtroTermo) ||
            String(p.chave_acesso).toLowerCase().includes(filtroTermo) ||
            String(p.razao_social || '').toLowerCase().includes(filtroTermo)
        );
    }

    pacotes.forEach(p => {
        let classeLinha = '';
        if (p.status === 'ok') classeLinha = 'status-ok';
        else if (p.status === 'duplicado') classeLinha = 'status-duplicate';
        else if (p.status === 'divergente_peso' || p.status === 'bloqueado') classeLinha = 'blink-error';

        tbody.innerHTML += `
            <tr class="${classeLinha}">
                <td class="admin-only"><input type="checkbox" class="chk-pacote" value="${p.id}"></td>
                <td><strong>${p.numero_nf}</strong></td>
                <td><code style="font-size:0.85em;">${p.chave_acesso}</code></td>
                <td>${p.razao_social || '-'}</td>
                <td>${p.descricao_produto || '-'}</td>
                <td>${p.uf}</td>
                <td><strong>${p.status.toUpperCase()}</strong></td>
                <td>${p.possui_guia_icms ? '<span style="color:#2563eb; font-weight:bold;">SIM</span>' : 'NÃO'}</td>
                <td>${p.peso_esperado_g ? Number(p.peso_esperado_g).toFixed(2) : '-'}</td>
                <td>${p.peso_lido_g ? Number(p.peso_lido_g).toFixed(2) : '-'}</td>
                <td>#${p.remessa_id}</td>
            </tr>
        `;
    });
    aplicarPermissoesPerfil();
}

function atualizarContadores() {
    if (!conferenciaAtual || !conferenciaAtual.pacotes) {
        document.getElementById('contador').textContent = '0 / 0';
        return;
    }
    const conferidos = conferenciaAtual.pacotes.filter(p => p.status === 'ok' || p.status === 'liberado_divergente').length;
    const total = conferenciaAtual.pacotes.length;
    document.getElementById('contador').textContent = `${conferidos} / ${total}`;
}

function filtrarPendentes() {
    filtroAtivo = !filtroAtivo;
    const btn = document.getElementById('btnFiltroPendentes');
    if (filtroAtivo) {
        btn.classList.add('active');
        btn.textContent = "Mostrando Apenas Pendentes";
    } else {
        btn.classList.remove('active');
        btn.textContent = "Pendentes de Conferência";
    }
    renderizarTabela();
}

function atualizarListaHistorico(conferencias) {
    const ul = document.getElementById('listaHistorico');
    if (!ul) return;
    ul.innerHTML = '';
    if (!conferencias || !conferencias.length) {
        ul.innerHTML = '<li>Nenhuma conferência registrada.</li>';
        return;
    }
    conferencias.slice(0, 5).forEach(c => {
        ul.innerHTML += `<li>${c.transportadora} - ${c.status.toUpperCase()} (${c.pacotes ? c.pacotes.length : 0} pacotes) - Iniciada em ${new Date(c.data_inicio).toLocaleDateString('pt-BR')}</li>`;
    });
}

// 5. MODAIS
function abrirModalDivergencia(codigo, detalhes) {
    const modal = document.getElementById('modalDivergenciaPeso');
    document.getElementById('detalhesDivergencia').innerHTML = `
        <p><strong>Pacote / NF:</strong> ${codigo}</p>
        <p><strong>Peso Esperado:</strong> ${detalhes.peso_esperado} g</p>
        <p><strong>Peso Lido:</strong> ${detalhes.peso_lido} g</p>
        <p><strong>Faixa Aceita:</strong> ${detalhes.faixa_aceita}</p>
        <p><strong>Tentativa:</strong> 1 de 2</p>
    `;
    modal.classList.add('visible');
}

function fecharModalDivergencia() {
    document.getElementById('modalDivergenciaPeso').classList.remove('visible');
    cancelarCaixaAtiva();
    document.getElementById('codigoInput').focus();
}

function abrirModalBloqueio(codigo, detalhes) {
    const modal = document.getElementById('modalBloqueioSuperior');
    const pacote = conferenciaAtual.pacotes.find(p => p.chave_acesso === codigo || p.numero_nf === codigo);
    document.getElementById('liberacaoPacoteId').value = pacote ? pacote.id : '';
    document.getElementById('detalhesBloqueio').innerHTML = `
        <p><strong>Pacote:</strong> ${codigo}</p>
        <p><strong>Peso Esperado:</strong> ${detalhes.peso_esperado} g</p>
        <p><strong>Peso Lido:</strong> ${detalhes.peso_lido} g</p>
        <p><strong>Faixa Aceita:</strong> ${detalhes.faixa_aceita}</p>
        <p style="color:#b91c1c;"><strong>Status:</strong> BLOQUEADO NA 2ª TENTATIVA</p>
    `;
    modal.classList.add('visible');
}

function fecharModalBloqueio() {
    document.getElementById('modalBloqueioSuperior').classList.remove('visible');
    document.getElementById('formLiberacaoSuperior').reset();
    cancelarCaixaAtiva();
    document.getElementById('codigoInput').focus();
}

async function submeterLiberacaoSuperior(e) {
    e.preventDefault();
    const payload = {
        pacote_id: document.getElementById('liberacaoPacoteId').value,
        email_superior: document.getElementById('emailSuperior').value,
        senha_superior: document.getElementById('senhaSuperior').value,
        justificativa: document.getElementById('justificativaSuperior').value
    };

    try {
        const res = await fetch(`${API_BASE}/conferencias/liberar-divergente`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${obterTokenAtual()}`
            },
            body: JSON.stringify(payload)
        });

        const resposta = await res.json();
        if (!res.ok) {
            mostrarMensagem(resposta.erro || "Falha na liberação do superior.", "error");
            return;
        }

        mostrarMensagem("Pacote autorizado e liberado com ressalva!", "success");
        fecharModalBloqueio();
        await recarregarConferenciaAtual();
    } catch {
        mostrarMensagem("Erro ao conectar à API para autorização.", "error");
    }
}

function abrirModalDuplicado(pacote) {
    const modal = document.getElementById('duplicateModal');
    const input = document.getElementById('modalConfirmationInput');
    document.getElementById('modalDetails').innerHTML = `
        <p><strong>NF:</strong> ${pacote.numero_nf}</p>
        <p><strong>Chave:</strong> ${pacote.chave_acesso}</p>
        <p><strong>Cliente:</strong> ${pacote.cliente || '-'}</p>
        <p><strong>Data da Conferência:</strong> ${new Date(pacote.data_conferido).toLocaleString()}</p>
    `;
    modal.classList.add('visible');
    input.value = '';
    input.focus();

    const handler = (e) => {
        if (e.key === 'Enter') {
            if (input.value.trim().toUpperCase() === 'DUPLICADO') {
                modal.classList.remove('visible');
                input.removeEventListener('keypress', handler);
                cancelarCaixaAtiva();
                document.getElementById('codigoInput').focus();
            } else {
                mostrarMensagem("Digite DUPLICADO para confirmar.", "warning");
                input.value = '';
            }
        }
    };
    input.addEventListener('keypress', handler);
}

function aplicarEfeitoVisual(tipo) {
    const input = document.getElementById('codigoInput');
    if (!input) return;
    input.classList.remove("blink-ok", "blink-duplicate", "blink-error", "blink-guide-required");
    input.classList.add(`blink-${tipo}`);
    setTimeout(() => {
        input.classList.remove(`blink-${tipo}`);
    }, 750);
}

// 6. CONTROLES ADMINISTRATIVOS
async function interromperConferencia() {
    if (!conferenciaAtual) return;
    if (!confirm(`Deseja interromper a conferência da ${conferenciaAtual.transportadora}?`)) return;

    await fetch(`${API_BASE}/conferencias/${conferenciaAtual.id}/interromper`, {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${obterTokenAtual()}` }
    });
    mostrarMensagem("Conferência interrompida e salva.", "info");
    conferenciaAtual = null;
    document.getElementById('transportadoraAtual').textContent = "Transportadora: Nenhuma Selecionada";
    document.getElementById('btnInterromper').disabled = true;
    document.getElementById('btnFinalizar').disabled = true;
    renderizarTabela();
    atualizarContadores();
    carregarConferenciasAtivas();
}

async function finalizarConferencia() {
    if (!conferenciaAtual) return;
    if (!confirm("Deseja realmente finalizar esta conferência?")) return;

    const res = await fetch(`${API_BASE}/conferencias/${conferenciaAtual.id}/finalizar`, {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${obterTokenAtual()}` }
    });

    const resposta = await res.json();
    if (!res.ok) {
        mostrarMensagem(resposta.erro, "error");
        return;
    }

    mostrarMensagem("Conferência finalizada com sucesso!", "success");
    conferenciaAtual = null;
    document.getElementById('transportadoraAtual').textContent = "Transportadora: Nenhuma Selecionada";
    document.getElementById('btnInterromper').disabled = true;
    document.getElementById('btnFinalizar').disabled = true;
    renderizarTabela();
    atualizarContadores();
    carregarConferenciasAtivas();
}

async function removerUltimaRemessa() {
    if (!conferenciaAtual) return;
    if (!confirm("Tem certeza que deseja remover a última remessa desta conferência?")) return;

    const res = await fetch(`${API_BASE}/conferencias/${conferenciaAtual.id}/remover-ultima-remessa`, {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${obterTokenAtual()}` }
    });

    const resposta = await res.json();
    if (!res.ok) {
        mostrarMensagem(resposta.erro, "error");
        return;
    }

    mostrarMensagem(resposta.mensagem, "info");
    await recarregarConferenciaAtual();
}

async function excluirPacotesSelecionados() {
    const marcados = Array.from(document.querySelectorAll('.chk-pacote:checked')).map(cb => Number(cb.value));
    if (!marcados.length) {
        mostrarMensagem("Selecione ao menos um pacote na tabela para excluir.", "warning");
        return;
    }

    if (!confirm(`Excluir permanentemente ${marcados.length} pacote(s)?`)) return;

    const res = await fetch(`${API_BASE}/conferencias/pacotes`, {
        method: 'DELETE',
        headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${obterTokenAtual()}`
        },
        body: JSON.stringify({ ids: marcados })
    });

    const resposta = await res.json();
    if (!res.ok) {
        mostrarMensagem(resposta.erro, "error");
        return;
    }

    mostrarMensagem(resposta.mensagem, "success");
    await recarregarConferenciaAtual();
}

window.retomarConferencia = retomarConferencia;
window.interromperConferencia = interromperConferencia;
window.finalizarConferencia = finalizarConferencia;
window.removerUltimaRemessa = removerUltimaRemessa;
window.excluirPacotesSelecionados = excluirPacotesSelecionados;
window.filtrarPendentes = filtrarPendentes;
window.cancelarCaixaAtiva = cancelarCaixaAtiva;
window.fecharModalDivergencia = fecharModalDivergencia;
window.fecharModalBloqueio = fecharModalBloqueio;
window.submeterLiberacaoSuperior = submeterLiberacaoSuperior;
window.handleFileImport = handleFileImport;