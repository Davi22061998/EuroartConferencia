let conferenciaAtual = null;
let caixaAtiva = null;
let filtroAtivo = false;
let filtroTermo = '';
let pesoAtualBalanca = 0;

const API_BASE = 'http://localhost:3000/api';

function obterTokenAtual() {
    return localStorage.getItem('token') || '';
}

function obterUsuarioAtual() {
    try {
        return JSON.parse(localStorage.getItem('usuario') || '{}');
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
    document.querySelectorAll('.admin-only').forEach(el => {
        el.style.display = user.perfil === 'admin' ? '' : 'none';
    });
}

function iniciarMonitoramentoBalanca() {
    setInterval(async () => {
        try {
            const display = document.getElementById('displayPesoBalanca');
            if (!display) return; 

            const res = await fetch('http://balanca-euroart.local/peso');
            if (res.ok) {
                const dados = await res.json();
                pesoAtualBalanca = Number(dados.peso_gramas);
                display.textContent = `${pesoAtualBalanca.toFixed(2)} g`;
            }
        } catch {
            // Ignora silenciosamente se o ESP32 estiver offline
        }
    }, 1000);
}

async function processarBipagem(codigo) {
    if (!codigo) return;
    const input = document.getElementById('codigoInput');

    if (!conferenciaAtual) {
        mostrarMensagem("Nenhuma conferência ativa. Retome ou importe uma remessa.", "warning");
        aplicarEfeitoVisual("error");
        if(input) input.value = '';
        return;
    }

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
                    const elCxAtiva = document.getElementById('displayCaixaAtiva');
                    if(elCxAtiva) elCxAtiva.textContent = `${caixaAtiva.codigo_sku} - ${caixaAtiva.nome}`;
                    
                    const elTara = document.getElementById('displayPesoTara');
                    if(elTara) elTara.textContent = `Tara: ${Number(caixaAtiva.peso_gramas).toFixed(2)}g`;
                    
                    const btnLimpa = document.getElementById('btnCancelarCaixa');
                    if(btnLimpa) btnLimpa.style.display = 'inline-block';

                    aplicarEfeitoVisual("ok");
                    mostrarMensagem(`Caixa ${caixaAtiva.nome} identificada. Bipe a NF ou Chave.`, "info");
                    if(input) {
                        input.value = '';
                        input.placeholder = "2º Bipe: NF ou Chave de Acesso";
                    }
                    return;
                }
            }
        } catch (err) {
            console.error(err);
        }
    }

    if (!caixaAtiva) {
        mostrarMensagem("Bipe primeiro o código/SKU da caixa!", "warning");
        aplicarEfeitoVisual("error");
        if(input) input.value = '';
        return;
    }

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
                peso_balanca: pesoAtualBalanca 
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
            mostrarMensagem("DIVERGÊNCIA: Pacote não pertence a esta conferência!", "error");
        } else {
            aplicarEfeitoVisual("error");
            mostrarMensagem(resposta.erro || "Erro na validação do pacote.", "error");
        }
    } catch {
        mostrarMensagem("Falha de ligação à API.", "error");
    } finally {
        if(input) {
            input.value = '';
            input.focus();
        }
    }
}

function cancelarCaixaAtiva() {
    caixaAtiva = null;
    const dispCaixa = document.getElementById('displayCaixaAtiva');
    if (dispCaixa) dispCaixa.textContent = "Aguardando bipagem...";
    
    const dispTara = document.getElementById('displayPesoTara');
    if (dispTara) dispTara.textContent = "Tara: 0.00g";
    
    const btnCanc = document.getElementById('btnCancelarCaixa');
    if (btnCanc) btnCanc.style.display = 'none';
    
    const input = document.getElementById('codigoInput');
    if (input) input.placeholder = "1º Bipe: Caixa (Barcode) | 2º Bipe: NF ou Chave de Acesso";
}

async function handleFileImport(event) {
    const file = event.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = async (e) => {
        try {
            const buffer = e.target.result;
            let textoJson = "";

            try {
                const utf8Decoder = new TextDecoder('utf-8', { fatal: true });
                textoJson = utf8Decoder.decode(buffer);
            } catch {
                const latinDecoder = new TextDecoder('windows-1252');
                textoJson = latinDecoder.decode(buffer);
            }

            textoJson = textoJson.replace(/\uFFFD/g, '°');

            const data = JSON.parse(textoJson);
            const res = await fetch(`${API_BASE}/conferencias/importar`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${obterTokenAtual()}`
                },
                body: JSON.stringify({
                    arquivo_nome: file.name,
                    pacotes: data,
                    conferencia_ativa_id: conferenciaAtual ? conferenciaAtual.id : null
                })
            });

            const resultado = await res.json();
            if (!res.ok) {
                mostrarMensagem(resultado.erro || "Erro ao importar remessa.", "error");
                return;
            }

            mostrarMensagem(resultado.mensagem, "success");
            await carregarConferenciasAtivas(resultado.conferencia_id);
        } catch (err) {
            console.error(err);
            mostrarMensagem("Erro ao processar ficheiro JSON. Verifique a estrutura.", "error");
        } finally {
            const inputJ = document.getElementById('jsonInput');
            if(inputJ) inputJ.value = '';
        }
    };
    reader.readAsArrayBuffer(file);
}

async function carregarConferenciasAtivas(selecionarId = null) {
    try {
        const res = await fetch(`${API_BASE}/conferencias/ativas`, {
            headers: { 'Authorization': `Bearer ${obterTokenAtual()}` }
        });

        if (!res.ok) return;

        const conferencias = await res.json();
        const select = document.getElementById('selectConferencia');
        
        if (select) {
            select.innerHTML = '';
            if (!Array.isArray(conferencias) || conferencias.length === 0) {
                select.innerHTML = '<option value="">Nenhuma conferência em andamento</option>';
            } else {
                conferencias.forEach(c => {
                    const total = c.pacotes?.length || 0;
                    const pend = c.pacotes?.filter(p => p.status !== 'ok' && p.status !== 'liberado_divergente').length || 0;
                    select.innerHTML += `<option value="${c.id}">${c.transportadora} - ${c.status.toUpperCase()} (${pend} restantes de ${total})</option>`;
                });
            }

            if (selecionarId) {
                select.value = selecionarId;
                await carregarDetalhesConferencia(selecionarId);
            }
        }
        
        atualizarListaHistorico(conferencias);
    } catch (err) {
        console.error("Falha ao carregar conferências ativas.", err);
    }
}

async function retomarConferencia() {
    const select = document.getElementById('selectConferencia');
    if (!select) return;
    
    const id = select.value;
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
        mostrarMensagem("Falha de ligação ao retomar conferência.", "error");
    }
}

async function carregarDetalhesConferencia(id) {
    if (!id) return;
    try {
        const res = await fetch(`${API_BASE}/conferencias/${id}`, {
            headers: { 'Authorization': `Bearer ${obterTokenAtual()}` }
        });

        if (!res.ok) return;

        conferenciaAtual = await res.json();

        const tituloT = document.getElementById('transportadoraAtual');
        if (tituloT) tituloT.textContent = `Transportadora: ${conferenciaAtual.transportadora}`;
        
        ['btnInterromper', 'btnFinalizar', 'btnResetRemessa', 'btnExcluirPacotes'].forEach(btnId => {
            const btn = document.getElementById(btnId);
            if (btn) btn.disabled = false;
        });

        renderizarTabela();
        atualizarContadores();
        cancelarCaixaAtiva();
    } catch {
        mostrarMensagem("Erro ao carregar dados da conferência.", "error");
    }
}

async function recarregarConferenciaAtual() {
    if (conferenciaAtual) await carregarDetalhesConferencia(conferenciaAtual.id);
}

function renderizarTabela() {
    const tbody = document.getElementById('listaPacotes');
    if (!tbody) return;

    tbody.innerHTML = '';

    if (!conferenciaAtual || !conferenciaAtual.pacotes || conferenciaAtual.pacotes.length === 0) {
        tbody.innerHTML = '<tr><td colspan="11" class="text-center py-4 text-muted">Nenhum pacote carregado nesta conferência.</td></tr>';
        return;
    }

    let pacotes = conferenciaAtual.pacotes;
    if (filtroAtivo) pacotes = pacotes.filter(p => p.status !== 'ok' && p.status !== 'liberado_divergente');
    if (filtroTermo) {
        pacotes = pacotes.filter(p =>
            String(p.numero_nf).toLowerCase().includes(filtroTermo) ||
            String(p.chave_acesso).toLowerCase().includes(filtroTermo) ||
            String(p.razao_social || '').toLowerCase().includes(filtroTermo) ||
            String(p.descricao_produto || '').toLowerCase().includes(filtroTermo)
        );
    }

    pacotes.forEach(p => {
        let badgeStatus = '';
        let rowClass = '';

        switch (p.status) {
            case 'ok': badgeStatus = '<span class="status-badge badge-ok"><i class="fas fa-check"></i> OK</span>'; rowClass = 'row-ok'; break;
            case 'liberado_divergente': badgeStatus = '<span class="status-badge badge-warning" title="Liberado por superior"><i class="fas fa-user-shield"></i> LIB. DIVERGENTE</span>'; rowClass = 'row-warning'; break;
            case 'divergente_peso': badgeStatus = '<span class="status-badge badge-danger"><i class="fas fa-weight-hanging"></i> PESO DIVERG.</span>'; rowClass = 'row-danger'; break;
            case 'bloqueado': badgeStatus = '<span class="status-badge badge-locked"><i class="fas fa-lock"></i> BLOQUEADO</span>'; rowClass = 'row-locked'; break;
            case 'duplicado': badgeStatus = '<span class="status-badge badge-duplicate"><i class="fas fa-copy"></i> DUPLICADO</span>'; rowClass = 'row-duplicate'; break;
            default: badgeStatus = '<span class="status-badge badge-pending"><i class="fas fa-clock"></i> PENDENTE</span>'; rowClass = '';
        }

        const chaveAcesso = String(p.chave_acesso);
        const chaveFormatada = chaveAcesso.length === 44 ? `${chaveAcesso.substring(0, 4)} ... ${chaveAcesso.substring(20, 24)} ... ${chaveAcesso.substring(40)}` : chaveAcesso;
        const produtoLimpo = (p.descricao_produto || '').replace(/[\uFFFD]/g, '°');
        const clienteLimpo = (p.razao_social || '').replace(/[\uFFFD]/g, '');

        tbody.innerHTML += `
            <tr class="${rowClass}">
                <td class="admin-only col-center"><input type="checkbox" class="chk-pacote" value="${p.id}"></td>
                <td class="col-nf"><strong>${p.numero_nf}</strong></td>
                <td class="col-chave" title="Clique para copiar: ${chaveAcesso}" onclick="navigator.clipboard.writeText('${chaveAcesso}'); mostrarMensagem('Chave copiada!', 'info')">
                    <code>${chaveFormatada}</code>
                </td>
                <td class="col-cliente" title="${clienteLimpo}">${clienteLimpo || '<span class="text-muted">-</span>'}</td>
                <td class="col-produto" title="${produtoLimpo}">${produtoLimpo || '<span class="text-muted">-</span>'}</td>
                <td class="col-center"><strong>${p.uf}</strong></td>
                <td class="col-center">${badgeStatus}</td>
                <td class="col-center">${p.possui_guia_icms ? '<span class="badge-guia">GUIA DIFAL</span>' : '<span class="text-muted">NÃO</span>'}</td>
                <td class="col-num">${p.peso_esperado_g ? Number(p.peso_esperado_g).toFixed(0) + ' g' : '-'}</td>
                <td class="col-num"><strong>${p.peso_lido_g ? Number(p.peso_lido_g).toFixed(0) + ' g' : '-'}</strong></td>
                <td class="col-center"><span class="badge-remessa">#${p.remessa_id}</span></td>
            </tr>
        `;
    });
    aplicarPermissoesPerfil();
}

function atualizarContadores() {
    const contadorEl = document.getElementById('contador');
    if (!contadorEl) return;

    if (!conferenciaAtual || !conferenciaAtual.pacotes) {
        contadorEl.innerHTML = `
            <div class="progress-info">
                <span class="progress-title">Nenhuma conferência em andamento</span>
                <span class="progress-percent">0%</span>
            </div>
            <div class="progress-bar-bg"><div class="progress-bar-fill" style="width: 0%"></div></div>
        `;
        return;
    }

    const conferidos = conferenciaAtual.pacotes.filter(p => p.status === 'ok' || p.status === 'liberado_divergente').length;
    const total = conferenciaAtual.pacotes.length;
    const porcentagem = total > 0 ? Math.round((conferidos / total) * 100) : 0;

    contadorEl.innerHTML = `
        <div class="progress-info">
            <span class="progress-title">Conferência em Andamento: <strong>${conferidos} de ${total} volumes</strong></span>
            <span class="progress-percent">${porcentagem}%</span>
        </div>
        <div class="progress-bar-bg">
            <div class="progress-bar-fill" style="width: ${porcentagem}%"></div>
        </div>
    `;
}

function filtrarPendentes() {
    filtroAtivo = !filtroAtivo;
    const btn = document.getElementById('btnFiltroPendentes');
    if (!btn) return;

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
        ul.innerHTML = '<li>Nenhuma conferência registada.</li>';
        return;
    }
    conferencias.slice(0, 5).forEach(c => {
        ul.innerHTML += `<li>${c.transportadora} - ${c.status.toUpperCase()} (${c.pacotes ? c.pacotes.length : 0} pacotes) - Iniciada em ${new Date(c.data_inicio).toLocaleDateString('pt-BR')}</li>`;
    });
}

function abrirModalDivergencia(codigo, detalhes) {
    const modal = document.getElementById('modalDivergenciaPeso');
    if (!modal) return;
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
    const modal = document.getElementById('modalDivergenciaPeso');
    if (modal) modal.classList.remove('visible');
    cancelarCaixaAtiva();
    const input = document.getElementById('codigoInput');
    if(input) input.focus();
}

function abrirModalBloqueio(codigo, detalhes) {
    const modal = document.getElementById('modalBloqueioSuperior');
    if (!modal) return;
    const pacote = conferenciaAtual.pacotes.find(p => p.chave_acesso === codigo || p.numero_nf === codigo);
    const idInput = document.getElementById('liberacaoPacoteId');
    if (idInput) idInput.value = pacote ? pacote.id : '';
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
    const modal = document.getElementById('modalBloqueioSuperior');
    if (modal) modal.classList.remove('visible');
    const form = document.getElementById('formLiberacaoSuperior');
    if (form) form.reset();
    cancelarCaixaAtiva();
    const input = document.getElementById('codigoInput');
    if(input) input.focus();
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
            headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${obterTokenAtual()}` },
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
        mostrarMensagem("Erro de ligação à API para autorização.", "error");
    }
}

function abrirModalDuplicado(pacote) {
    const modal = document.getElementById('duplicateModal');
    if(!modal) return;
    const input = document.getElementById('modalConfirmationInput');
    document.getElementById('modalDetails').innerHTML = `
        <p><strong>NF:</strong> ${pacote.numero_nf}</p>
        <p><strong>Chave:</strong> ${pacote.chave_acesso}</p>
        <p><strong>Cliente:</strong> ${pacote.cliente || '-'}</p>
        <p><strong>Data da Conferência:</strong> ${new Date(pacote.data_conferido).toLocaleString()}</p>
    `;
    modal.classList.add('visible');
    if (input) {
        input.value = '';
        input.focus();
    }

    const handler = (e) => {
        if (e.key === 'Enter') {
            if (input.value.trim().toUpperCase() === 'DUPLICADO') {
                modal.classList.remove('visible');
                input.removeEventListener('keypress', handler);
                cancelarCaixaAtiva();
                const codeInput = document.getElementById('codigoInput');
                if(codeInput) codeInput.focus();
            } else {
                mostrarMensagem("Digite DUPLICADO para confirmar.", "warning");
                input.value = '';
            }
        }
    };
    if (input) input.addEventListener('keypress', handler);
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

async function interromperConferencia() {
    if (!conferenciaAtual) return;
    if (!confirm(`Deseja interromper a conferência da ${conferenciaAtual.transportadora}?`)) return;

    await fetch(`${API_BASE}/conferencias/${conferenciaAtual.id}/interromper`, {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${obterTokenAtual()}` }
    });

    mostrarMensagem("Conferência interrompida e salva.", "info");

    conferenciaAtual = null;
    cancelarCaixaAtiva();

    const titulo = document.getElementById('transportadoraAtual');
    if(titulo) titulo.textContent = "Transportadora: Nenhuma Selecionada";
    
    ['btnInterromper', 'btnFinalizar', 'btnResetRemessa', 'btnExcluirPacotes'].forEach(btnId => {
        const btn = document.getElementById(btnId);
        if (btn) btn.disabled = true;
    });

    const tbody = document.getElementById('listaPacotes');
    if(tbody) tbody.innerHTML = '<tr><td colspan="11" class="text-center py-4 text-muted">Nenhuma conferência em andamento no momento. Selecione uma transportadora e clique em "Retomar" ou importe um JSON.</td></tr>';

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
    cancelarCaixaAtiva();

    const titulo = document.getElementById('transportadoraAtual');
    if(titulo) titulo.textContent = "Transportadora: Nenhuma Selecionada";
    
    ['btnInterromper', 'btnFinalizar', 'btnResetRemessa', 'btnExcluirPacotes'].forEach(btnId => {
        const btn = document.getElementById(btnId);
        if (btn) btn.disabled = true;
    });

    const tbody = document.getElementById('listaPacotes');
    if(tbody) tbody.innerHTML = '<tr><td colspan="11" class="text-center py-4 text-muted">Nenhuma conferência selecionada.</td></tr>';

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
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${obterTokenAtual()}` },
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