const API_BASE = '/api/parametrizacao';

function obterToken() {
    return localStorage.getItem('token') || '';
}

document.addEventListener('DOMContentLoaded', () => {
    carregarCaixas();
    carregarProdutos();

    document.getElementById('formCaixa').addEventListener('submit', salvarCaixa);
    document.getElementById('formProduto').addEventListener('submit', salvarProduto);
});

// ==========================================
// CAIXAS (EMBALAGENS)
// ==========================================
async function carregarCaixas() {
    try {
        const res = await fetch(`${API_BASE}/caixas`, {
            headers: { 'Authorization': `Bearer ${obterToken()}` }
        });
        const caixas = await res.json();
        
        const tbody = document.getElementById('listaCaixas');
        tbody.innerHTML = '';

        if (!Array.isArray(caixas) || caixas.length === 0) {
            tbody.innerHTML = '<tr><td colspan="6" class="text-center py-4 text-muted">Nenhuma caixa cadastrada.</td></tr>';
            return;
        }

        caixas.forEach(c => {
            const sku = c.codigo_sku || c.sku || '-';
            const peso = Number(c.peso_gramas ?? c.peso ?? 0);

            tbody.innerHTML += `
                <tr>
                    <td>#${c.id}</td>
                    <td><strong>${sku}</strong></td>
                    <td>${c.nome}</td>
                    <td>${peso.toFixed(2)} g</td>
                    <td>${c.descricao || '-'}</td>
                    <td class="col-center">
                        <button onclick='editarCaixa(${JSON.stringify(c)})' style="background:#3b82f6; color:#fff; border:none; padding:5px 8px; border-radius:4px; cursor:pointer;"><i class="fas fa-edit"></i></button>
                        <button onclick='excluirCaixa(${c.id})' style="background:#ef4444; color:#fff; border:none; padding:5px 8px; border-radius:4px; cursor:pointer;"><i class="fas fa-trash"></i></button>
                    </td>
                </tr>
            `;
        });
    } catch (err) {
        console.error("Erro ao carregar caixas", err);
    }
}

async function salvarCaixa(e) {
    e.preventDefault();
    const id = document.getElementById('caixaId').value;
    
    const skuLimpo = document.getElementById('caixaSku').value.trim();
    const nomeLimpo = document.getElementById('caixaNome').value.trim();
    const pesoLimpo = parseFloat(document.getElementById('caixaPeso').value.replace(',', '.').trim());
    const descLimpa = document.getElementById('caixaDescricao').value.trim();

    const payload = {
        codigo_sku: skuLimpo,
        sku: skuLimpo,
        nome: nomeLimpo,
        peso_gramas: pesoLimpo,
        peso: pesoLimpo,
        descricao: descLimpa
    };

    const url = id ? `${API_BASE}/caixas/${id}` : `${API_BASE}/caixas`;
    const method = id ? 'PUT' : 'POST';

    try {
        const res = await fetch(url, {
            method,
            headers: { 
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${obterToken()}` 
            },
            body: JSON.stringify(payload)
        });

        if (res.ok) {
            document.getElementById('formCaixa').reset();
            document.getElementById('caixaId').value = '';
            carregarCaixas();
            mostrarMensagem("Caixa salva com sucesso!", "success");
        } else {
            const erro = await res.json();
            mostrarMensagem(erro.erro || erro.message || "Erro ao salvar caixa.", "error");
        }
    } catch (err) {
        mostrarMensagem("Erro de comunicação.", "error");
    }
}

function editarCaixa(caixa) {
    document.getElementById('caixaId').value = caixa.id;
    document.getElementById('caixaSku').value = caixa.codigo_sku || caixa.sku || '';
    document.getElementById('caixaNome').value = caixa.nome || '';
    document.getElementById('caixaPeso').value = caixa.peso_gramas ?? caixa.peso ?? '';
    document.getElementById('caixaDescricao').value = caixa.descricao || '';
}

function excluirCaixa(id) {
    mostrarConfirmacao("Tem a certeza que deseja excluir esta caixa?", async () => {
        try {
            const res = await fetch(`${API_BASE}/caixas/${id}`, {
                method: 'DELETE',
                headers: { 'Authorization': `Bearer ${obterToken()}` }
            });
            if (res.ok) {
                carregarCaixas();
                mostrarMensagem("Caixa excluída.", "success");
            } else {
                mostrarMensagem("Erro ao excluir caixa.", "error");
            }
        } catch (err) {
            mostrarMensagem("Erro de comunicação.", "error");
        }
    });
}

// ==========================================
// PRODUTOS (SKUs)
// ==========================================
async function carregarProdutos() {
    try {
        const res = await fetch(`${API_BASE}/produtos`, {
            headers: { 'Authorization': `Bearer ${obterToken()}` }
        });
        const produtos = await res.json();
        
        const tbody = document.getElementById('listaProdutos');
        tbody.innerHTML = '';

        if (!Array.isArray(produtos) || produtos.length === 0) {
            tbody.innerHTML = '<tr><td colspan="6" class="text-center py-4 text-muted">Nenhum produto cadastrado.</td></tr>';
            return;
        }

        produtos.forEach(p => {
            const sku = p.codigo_sku || p.sku || '-';
            const nome = p.nome || p.descricao || '-';
            const peso = Number(p.peso_unitario_gramas ?? p.peso ?? 0);
            const tolerancia = Number(p.tolerancia_peso_porcento ?? p.tolerancia ?? 0);

            tbody.innerHTML += `
                <tr>
                    <td>#${p.id}</td>
                    <td><strong>${sku}</strong></td>
                    <td>${nome}</td>
                    <td>${peso.toFixed(2)} g</td>
                    <td>${tolerancia.toFixed(1)}%</td>
                    <td class="col-center">
                        <button onclick='editarProduto(${JSON.stringify(p)})' style="background:#3b82f6; color:#fff; border:none; padding:5px 8px; border-radius:4px; cursor:pointer;"><i class="fas fa-edit"></i></button>
                        <button onclick='excluirProduto(${p.id})' style="background:#ef4444; color:#fff; border:none; padding:5px 8px; border-radius:4px; cursor:pointer;"><i class="fas fa-trash"></i></button>
                    </td>
                </tr>
            `;
        });
    } catch (err) {
        console.error("Erro ao carregar produtos", err);
    }
}

async function salvarProduto(e) {
    e.preventDefault();
    const id = document.getElementById('produtoId').value;
    
    const skuLimpo = document.getElementById('produtoSku').value.trim();
    const nomeLimpo = document.getElementById('produtoNome').value.trim();
    const pesoLimpo = parseFloat(document.getElementById('produtoPeso').value.replace(',', '.').trim());
    const tolStr = document.getElementById('produtoTolerancia').value.replace(',', '.').trim();
    const tolLimpa = tolStr === '' ? 5 : parseFloat(tolStr);

    const payload = {
        sku: skuLimpo,
        codigo_sku: skuLimpo,
        nome: nomeLimpo,
        descricao: nomeLimpo,
        peso: pesoLimpo,
        peso_unitario_gramas: pesoLimpo,
        tolerancia: tolLimpa,
        tolerancia_peso_porcento: tolLimpa
    };

    const url = id ? `${API_BASE}/produtos/${id}` : `${API_BASE}/produtos`;
    const method = id ? 'PUT' : 'POST';

    try {
        const res = await fetch(url, {
            method,
            headers: { 
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${obterToken()}` 
            },
            body: JSON.stringify(payload)
        });

        if (res.ok) {
            document.getElementById('formProduto').reset();
            document.getElementById('produtoId').value = '';
            carregarProdutos();
            mostrarMensagem("Produto salvo com sucesso!", "success");
        } else {
            const erro = await res.json();
            mostrarMensagem(erro.erro || erro.message || "Erro ao salvar produto.", "error");
        }
    } catch (err) {
        mostrarMensagem("Erro de comunicação.", "error");
    }
}

function editarProduto(produto) {
    document.getElementById('produtoId').value = produto.id;
    document.getElementById('produtoSku').value = produto.codigo_sku || produto.sku || '';
    document.getElementById('produtoNome').value = produto.nome || produto.descricao || '';
    document.getElementById('produtoPeso').value = produto.peso_unitario_gramas ?? produto.peso ?? '';
    document.getElementById('produtoTolerancia').value = produto.tolerancia_peso_porcento ?? produto.tolerancia ?? '';
}

function excluirProduto(id) {
    mostrarConfirmacao("Tem a certeza que deseja excluir este produto?", async () => {
        try {
            const res = await fetch(`${API_BASE}/produtos/${id}`, {
                method: 'DELETE',
                headers: { 'Authorization': `Bearer ${obterToken()}` }
            });
            if (res.ok) {
                carregarProdutos();
                mostrarMensagem("Produto excluído.", "success");
            } else {
                mostrarMensagem("Erro ao excluir produto.", "error");
            }
        } catch (err) {
            mostrarMensagem("Erro de comunicação.", "error");
        }
    });
}