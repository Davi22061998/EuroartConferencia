let graficoStatus = null;
let graficoTransportadoras = null;

function coresDoTema() {
    const estilos = getComputedStyle(document.documentElement);
    return {
        texto: estilos.getPropertyValue('--text-secondary').trim() || '#64748b',
        grade: estilos.getPropertyValue('--border-color').trim() || '#e2e8f0',
        superficie: estilos.getPropertyValue('--panel-bg').trim() || '#ffffff'
    };
}

function atualizarTemaGraficos() {
    const cores = coresDoTema();
    [graficoStatus, graficoTransportadoras].filter(Boolean).forEach((grafico) => {
        grafico.options.plugins.legend.labels.color = cores.texto;
        grafico.options.plugins.tooltip.backgroundColor = cores.superficie;
        grafico.options.plugins.tooltip.titleColor = cores.texto;
        grafico.options.plugins.tooltip.bodyColor = cores.texto;
        if (grafico.options.scales) {
            Object.values(grafico.options.scales).forEach((eixo) => {
                if (eixo.ticks) eixo.ticks.color = cores.texto;
                if (eixo.grid) eixo.grid.color = cores.grade;
            });
        }
        grafico.update('none');
    });
}

document.addEventListener('DOMContentLoaded', async () => {
    try {
        const token = localStorage.getItem('token');
        const res = await fetch('/api/conferencias/dashboard', {
            headers: { 'Authorization': `Bearer ${token}` }
        });
        if (!res.ok) throw new Error('Não foi possível carregar os indicadores do dashboard.');

        const data = await res.json();
        document.getElementById('kpiTotal').textContent = data.kpis.totalPacotes;
        document.getElementById('kpiOk').textContent = data.kpis.pacotesOk;
        document.getElementById('kpiErro').textContent = data.kpis.pacotesErro;
        document.getElementById('kpiCaixas').textContent = data.kpis.totalCaixas;

        const cores = coresDoTema();
        const ctxStatus = document.getElementById('chartStatus').getContext('2d');
        graficoStatus = new Chart(ctxStatus, {
            type: 'doughnut',
            data: {
                labels: data.graficoStatus.map(s => s.status.toUpperCase()),
                datasets: [{
                    data: data.graficoStatus.map(s => s.total),
                    backgroundColor: ['#22a879', '#e0a33b', '#d65b5b', '#4b83d8', '#94a3b8'],
                    borderColor: cores.superficie,
                    borderWidth: 3,
                    hoverOffset: 6
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                cutout: '68%',
                plugins: {
                    legend: { position: 'bottom', labels: { color: cores.texto, usePointStyle: true, boxWidth: 8, padding: 18 } },
                    tooltip: { backgroundColor: cores.superficie, titleColor: cores.texto, bodyColor: cores.texto, borderColor: cores.grade, borderWidth: 1 }
                }
            }
        });

        const ctxTransp = document.getElementById('chartTransportadoras').getContext('2d');
        graficoTransportadoras = new Chart(ctxTransp, {
            type: 'bar',
            data: {
                labels: data.graficoTransportadoras.map(t => t.transportadora || 'Desconhecida'),
                datasets: [{
                    label: 'Volumes processados',
                    data: data.graficoTransportadoras.map(t => t.total),
                    backgroundColor: '#477bd1',
                    borderRadius: 7,
                    maxBarThickness: 42
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    legend: { display: false },
                    tooltip: {
                        backgroundColor: cores.superficie,
                        titleColor: cores.texto,
                        bodyColor: cores.texto,
                        borderColor: cores.grade,
                        borderWidth: 1,
                        callbacks: {
                            title: (items) => {
                                const indice = items[0]?.dataIndex;
                                return data.graficoTransportadoras[indice]?.transportadora || 'Desconhecida';
                            },
                            label: (context) => `Volumes processados: ${context.formattedValue}`
                        }
                    }
                },
                scales: {
                    x: {
                        ticks: { display: false },
                        grid: { display: false }
                    },
                    y: { beginAtZero: true, ticks: { color: cores.texto, precision: 0 }, grid: { color: cores.grade } }
                }
            }
        });

        const tbodyProdutos = document.getElementById('listaTopProdutos');
        tbodyProdutos.innerHTML = '';
        (data.topProdutos || []).forEach(p => {
            tbodyProdutos.insertAdjacentHTML('beforeend', `
                <tr>
                    <td><strong>${p.codigo_sku}</strong></td>
                    <td>${p.descricao_produto}</td>
                    <td class="dashboard-quantity">${p.total_vendido} <span>un.</span></td>
                </tr>
            `);
        });
        if (!data.topProdutos || data.topProdutos.length === 0) {
            tbodyProdutos.innerHTML = '<tr><td colspan="3" class="text-center py-4 text-muted">Sem dados de expedição no período.</td></tr>';
        }

        window.addEventListener('euroart-theme-change', atualizarTemaGraficos);
        atualizarTemaGraficos();
    } catch (err) {
        console.error('Erro ao carregar dashboard', err);
    }
});
