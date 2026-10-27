document.addEventListener('DOMContentLoaded', async () => {
    try {
        const token = localStorage.getItem('token');
        const res = await fetch('http://localhost:3000/api/conferencias/historico-geral', {
            headers: { 'Authorization': `Bearer ${token}` }
        });
        
        const tbody = document.getElementById('listaHistoricoGeral');
        
        if (!res.ok) {
            tbody.innerHTML = '<tr><td colspan="7" class="text-center py-4" style="color: #ef4444;">Erro ao aceder aos dados do histórico.</td></tr>';
            return;
        }

        const pacotes = await res.json();
        tbody.innerHTML = '';

        if (!Array.isArray(pacotes) || pacotes.length === 0) {
            tbody.innerHTML = '<tr><td colspan="7" class="text-center py-4 text-muted">Nenhum pacote processado até ao momento.</td></tr>';
            return;
        }

        pacotes.forEach(p => {
            // Garante que apanha uma data válida para a conferência
            const dataBruta = p.data_conferido || p.updatedAt || p.createdAt || new Date();
            const dataConf = new Date(dataBruta).toLocaleString('pt-BR');
            let badge = '';
            
            if(p.status === 'ok') badge = '<span style="color:#10b981; font-weight:bold;">OK</span>';
            else if(p.status === 'liberado_divergente') badge = '<span style="color:#f59e0b; font-weight:bold;">LIBERADO</span>';
            else if(p.status === 'divergente_peso') badge = '<span style="color:#ef4444; font-weight:bold;">ERRO PESO</span>';
            else badge = `<span style="color:#94a3b8; font-weight:bold;">${String(p.status).toUpperCase()}</span>`;

            tbody.innerHTML += `
                <tr style="border-bottom: 1px solid #f1f5f9;">
                    <td>${dataConf}</td>
                    <td><strong>${p.numero_nf || '-'}</strong></td>
                    <td>${p.razao_social || '-'}</td>
                    <td>${p.conferencia && p.conferencia.transportadora ? p.conferencia.transportadora : 'Desconhecida'}</td>
                    <td class="col-center">${badge}</td>
                    <td>${p.peso_lido_g ? p.peso_lido_g + 'g' : '-'}</td>
                    <td style="font-size: 0.85em; color: #64748b;">${p.justificativa_liberacao || '-'}</td>
                </tr>
            `;
        });

    } catch (err) {
        console.error('Erro ao carregar histórico', err);
        const tbody = document.getElementById('listaHistoricoGeral');
        if(tbody) tbody.innerHTML = '<tr><td colspan="7" class="text-center py-4" style="color: #ef4444;">Falha de ligação ao servidor.</td></tr>';
    }
});