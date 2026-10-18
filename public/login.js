const API_URL = 'http://localhost:3000/api/auth';
let isSetupMode = false;

// Função que roda ao abrir a página para checar se o banco está vazio
async function verificarSetup() {
    try {
        const response = await fetch(`${API_URL}/check-setup`);
        const data = await response.json();

        if (data.hasUsers === false) {
            // Banco vazio! Força o modo de Setup (Criação do Admin)
            isSetupMode = true;
            document.getElementById('nomeInput').style.display = 'block';
            document.getElementById('nomeInput').setAttribute('required', 'true');
            document.getElementById('submitBtn').textContent = 'Configurar Administrador';
            document.getElementById('form-title').textContent = 'Configuração Inicial do Sistema';
            mostrarMensagem("Bem-vindo! Crie o usuário administrador para iniciar.", "info");
        }
    } catch (error) {
        console.error("Erro ao checar status do sistema:", error);
    }
}

// Roda a verificação assim que a tela abre
verificarSetup();

document.getElementById('auth-form').addEventListener('submit', async (e) => {
    e.preventDefault();

    const email = document.getElementById('emailInput').value;
    const senha = document.getElementById('senhaInput').value;
    const nome = document.getElementById('nomeInput').value;

    const endpoint = isSetupMode ? `${API_URL}/registrar` : `${API_URL}/login`;
    const bodyData = isSetupMode ? { nome, email, senha } : { email, senha };

    try {
        const response = await fetch(endpoint, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(bodyData)
        });

        const data = await response.json();

        if (!response.ok) {
            mostrarMensagem(data.erro || "Erro na autenticação.", "error");
            return;
        }

        if (!isSetupMode) {
            // LOGOU COM SUCESSO
            mostrarMensagem("Login realizado com sucesso! Redirecionando...", "success");
            localStorage.setItem('token', data.token);
            localStorage.setItem('usuario', JSON.stringify(data.usuario));
            
            setTimeout(() => {
                window.location.href = 'index.html'; // Vai para a tela de conferência
            }, 1000);
        } else {
            // ADMIN CRIADO COM SUCESSO
            mostrarMensagem("Administrador criado! Por favor, faça login.", "success");
            setTimeout(() => {
                window.location.reload(); // Recarrega a página para entrar no modo Login normal
            }, 2000);
        }

    } catch (error) {
        mostrarMensagem("Erro ao conectar com o servidor.", "error");
    }
});