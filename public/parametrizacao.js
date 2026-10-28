const API_BASE = 'http://localhost:3000/api/parametrizacao';

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
            tbody.innerHTML += `
                <tr>
                    <td>#${c.id}</td>
                    <td><strong>${c.codigo_sku}</strong></td>
                    <td>${c.nome}</td>
                    <td>${Number(c.peso_gramas).toFixed(2)} g</td>
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
    
    // Converte a vírgula para ponto e limpa espaços
    const pesoLimpo = document.getElementById('caixaPeso').value.replace(',', '.').trim();

    const payload = {
        codigo_sku: document.getElementById('caixaSku').value,
        nome: document.getElementById('caixaNome').value,
        peso_gramas: pesoLimpo,
        descricao: document.getElementById('caixaDescricao').value
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
            mostrarMensagem(erro.erro || "Erro ao salvar caixa.", "error");
        }
    } catch (err) {
        mostrarMensagem("Erro de comunicação.", "error");
    }
}

function editarCaixa(caixa) {
    document.getElementById('caixaId').value = caixa.id;
    document.getElementById('caixaSku').value = caixa.codigo_sku;
    document.getElementById('caixaNome').value = caixa.nome;
    document.getElementById('caixaPeso').value = caixa.peso_gramas;
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
            tbody.innerHTML += `
                <tr>
                    <td>#${p.id}</td>
                    <td><strong>${p.codigo_sku}</strong></td>
                    <td>${p.nome || p.descricao || '-'}</td>
                    <td>${Number(p.peso_unitario_gramas).toFixed(2)} g</td>
                    <td>${Number(p.tolerancia_peso_porcento).toFixed(1)}%</td>
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
    
    // Converte a vírgula para ponto e limpa espaços
    const pesoLimpo = document.getElementById('produtoPeso').value.replace(',', '.').trim();
    const tolLimpa = document.getElementById('produtoTolerancia').value.replace(',', '.').trim();

    const payload = {
        codigo_sku: document.getElementById('produtoSku').value,
        nome: document.getElementById('produtoNome').value,
        peso_unitario_gramas: pesoLimpo,
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
            mostrarMensagem(erro.erro || "Erro ao salvar produto.", "error");
        }
    } catch (err) {
        mostrarMensagem("Erro de comunicação.", "error");
    }
}

function editarProduto(produto) {
    document.getElementById('produtoId').value = produto.id;
    document.getElementById('produtoSku').value = produto.codigo_sku;
    document.getElementById('produtoNome').value = produto.nome || produto.descricao || '';
    document.getElementById('produtoPeso').value = produto.peso_unitario_gramas;
    document.getElementById('produtoTolerancia').value = produto.tolerancia_peso_porcento;
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