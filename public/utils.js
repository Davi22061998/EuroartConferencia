function mostrarMensagem(mensagem, tipo) {
    const feedback = document.getElementById('feedbackMessage');
    if (!feedback) {
        alert(mensagem);
        return;
    }
    
    feedback.textContent = mensagem;
    feedback.style.display = 'block';
    
    feedback.className = 'feedback-message';
    if (tipo === 'success') { feedback.style.backgroundColor = 'var(--cor-sucesso-fundo)'; feedback.style.color = 'var(--cor-sucesso-texto)'; }
    if (tipo === 'error') { feedback.style.backgroundColor = 'var(--cor-erro-fundo)'; feedback.style.color = 'var(--cor-erro-texto)'; }
    if (tipo === 'warning') { feedback.style.backgroundColor = 'var(--cor-alerta-fundo)'; feedback.style.color = 'var(--cor-alerta-texto)'; }
    if (tipo === 'info') { feedback.style.backgroundColor = 'var(--cor-info-fundo)'; feedback.style.color = 'var(--cor-info-texto)'; }

    setTimeout(() => {
        feedback.style.display = 'none';
    }, 4000);
}