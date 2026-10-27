document.addEventListener('DOMContentLoaded', async () => {
    try {
        const token = localStorage.getItem('token');
        const res = await fetch('http://localhost:3000/api/conferencias/dashboard', {
            headers: { 'Authorization': `Bearer ${token}` }
        });
        
        const data = await res.json();
        
        document.getElementById('kpiTotal').textContent = data.kpis.totalPacotes;
        document.getElementById('kpiOk').textContent = data.kpis.pacotesOk;
        document.getElementById('kpiErro').textContent = data.kpis.pacotesErro;
        document.getElementById('kpiCaixas').textContent = data.kpis.totalCaixas;

        const ctxStatus = document.getElementById('chartStatus').getContext('2d');
        const labelsStatus = data.graficoStatus.map(s => s.status.toUpperCase());
        const valuesStatus = data.graficoStatus.map(s => s.total);
        
        new Chart(ctxStatus, {
            type: 'doughnut',
            data: {
                labels: labelsStatus,
                datasets: [{
                    data: valuesStatus,
                    backgroundColor: ['#10b981', '#f59e0b', '#ef4444', '#3b82f6', '#94a3b8'],
                }]
            },
            options: { responsive: true, maintainAspectRatio: false }
        });

        const ctxTransp = document.getElementById('chartTransportadoras').getContext('2d');
        const labelsTransp = data.graficoTransportadoras.map(t => t.transportadora || 'Desconhecida');
        const valuesTransp = data.graficoTransportadoras.map(t => t.total);

        new Chart(ctxTransp, {
            type: 'bar',
            data: {
                labels: labelsTransp,
                datasets: [{
                    label: 'Volumes Processados',
                    data: valuesTransp,
                    backgroundColor: '#3b82f6',
                }]
            },
            options: { responsive: true, maintainAspectRatio: false }
        });

        const tbodyProdutos = document.getElementById('listaTopProdutos');
        tbodyProdutos.innerHTML = '';
        data.topProdutos.forEach(p => {
            tbodyProdutos.innerHTML += `
                <tr style="border-bottom: 1px solid #f1f5f9;">
                    <td style="padding: 10px;"><strong>${p.codigo_sku}</strong></td>
                    <td style="padding: 10px;">${p.descricao_produto}</td>
                    <td style="padding: 10px; text-align: center; font-weight: bold; color: #10b981;">${p.total_vendido} un.</td>
                </tr>
            `;
        });

    } catch (err) {
        console.error('Erro ao carregar dashboard', err);
    }
});