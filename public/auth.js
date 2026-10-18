// public/auth.js
const token = localStorage.getItem('token');
const usuarioLogado = JSON.parse(localStorage.getItem('usuario') || 'null');

// Se não houver token e não estivermos na tela de login, expulsa para o login
if (!token || !usuarioLogado) {
    if (!window.location.href.includes('login.html')) {
        window.location.href = 'login.html';
    }
}

// Função global para encerrar a sessão
function fazerLogout() {
    localStorage.removeItem('token');
    localStorage.removeItem('usuario');
    window.location.href = 'login.html';
}