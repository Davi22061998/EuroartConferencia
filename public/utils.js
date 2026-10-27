// Exibe mensagens temporárias no topo (verde/vermelho)
function mostrarMensagem(mensagem, tipo = 'info') {
    const div = document.getElementById('feedbackMessage');
    if (!div) {
        alert(mensagem);
        return;
    }
    div.textContent = mensagem;
    div.className = `feedback-message visible ${tipo}`;
    
    // Remove as classes de cor anteriores
    div.classList.remove('success', 'error', 'warning', 'info');
    div.classList.add(tipo);

    setTimeout(() => {
        div.className = 'feedback-message';
    }, 4000);
}

// Versículo do dia no rodapé
document.addEventListener('DOMContentLoaded', () => {
    const versiculoEl = document.getElementById('versiculo-do-dia');
    if (versiculoEl) {
        const versiculos = [
            '"Tudo posso naquele que me fortalece." - Filipenses 4:13',
            '"O Senhor é o meu pastor; de nada terei falta." - Salmos 23:1',
            '"Entregue o seu caminho ao Senhor; confie nele, e ele o fará." - Salmos 37:5',
            '"O choro pode durar uma noite, mas a alegria vem pela manhã." - Salmos 30:5'
        ];
        const dia = new Date().getDate();
        versiculoEl.textContent = versiculos[dia % versiculos.length];
    }
});

// NOVO: Função global para substituir o confirm() padrão do navegador
function mostrarConfirmacao(mensagem, callbackConfirmacao) {
    const overlay = document.createElement('div');
    overlay.style.position = 'fixed';
    overlay.style.top = '0'; 
    overlay.style.left = '0';
    overlay.style.width = '100vw'; 
    overlay.style.height = '100vh';
    overlay.style.backgroundColor = 'rgba(15, 23, 42, 0.8)';
    overlay.style.display = 'flex';
    overlay.style.alignItems = 'center';
    overlay.style.justifyContent = 'center';
    overlay.style.zIndex = '99999';

    const modal = document.createElement('div');
    modal.style.background = '#fff';
    modal.style.padding = '30px';
    modal.style.borderRadius = '8px';
    modal.style.width = '90%';
    modal.style.maxWidth = '420px';
    modal.style.boxShadow = '0 10px 15px -3px rgba(0,0,0,0.1)';
    modal.style.textAlign = 'center';

    const icone = document.createElement('div');
    icone.innerHTML = '<i class="fas fa-question-circle" style="font-size: 3.5rem; color: #3b82f6; margin-bottom: 20px;"></i>';
    
    const texto = document.createElement('p');
    texto.textContent = mensagem;
    texto.style.fontSize = '1.15em';
    texto.style.color = '#334155';
    texto.style.marginBottom = '25px';
    texto.style.fontWeight = '500';

    const divBotoes = document.createElement('div');
    divBotoes.style.display = 'flex';
    divBotoes.style.gap = '15px';
    divBotoes.style.justifyContent = 'center';

    const btnCancelar = document.createElement('button');
    btnCancelar.innerHTML = '<i class="fas fa-times"></i> Cancelar';
    btnCancelar.style.padding = '10px 20px';
    btnCancelar.style.border = 'none';
    btnCancelar.style.background = '#e2e8f0';
    btnCancelar.style.color = '#475569';
    btnCancelar.style.borderRadius = '6px';
    btnCancelar.style.cursor = 'pointer';
    btnCancelar.style.fontWeight = 'bold';
    btnCancelar.onclick = () => document.body.removeChild(overlay);

    const btnConfirmar = document.createElement('button');
    btnConfirmar.innerHTML = '<i class="fas fa-check"></i> Confirmar';
    btnConfirmar.style.padding = '10px 20px';
    btnConfirmar.style.border = 'none';
    btnConfirmar.style.background = '#10b981';
    btnConfirmar.style.color = '#fff';
    btnConfirmar.style.borderRadius = '6px';
    btnConfirmar.style.cursor = 'pointer';
    btnConfirmar.style.fontWeight = 'bold';
    btnConfirmar.onclick = () => {
        document.body.removeChild(overlay);
        callbackConfirmacao();
    };

    divBotoes.appendChild(btnCancelar);
    divBotoes.appendChild(btnConfirmar);

    modal.appendChild(icone);
    modal.appendChild(texto);
    modal.appendChild(divBotoes);
    overlay.appendChild(modal);
    document.body.appendChild(overlay);
}

window.mostrarMensagem = mostrarMensagem;
window.mostrarConfirmacao = mostrarConfirmacao;