// public/menu.js
function carregarMenu(itemAtivoId) {
    const usuarioLogado = JSON.parse(localStorage.getItem('usuario') || 'null');
    
    const nomeAdmin = usuarioLogado ? usuarioLogado.nome.split(' ')[0] : 'Usuário';
    const isAdmin = usuarioLogado && usuarioLogado.perfil === 'admin';
    const cargoDisplay = isAdmin ? 'Administrador' : 'Conferente';

    // Cria o HTML do botão de usuários APENAS se for Admin
    const menuUsuariosHTML = isAdmin 
        ? `<li id="menu-usuarios" onclick="window.location.href='usuarios.html'"><i class="fas fa-users-cog"></i> Gestão de Usuários</li>`
        : '';

    const menuHTML = `
        <aside class="sidebar">
            <div class="sidebar-header">
                <img src="images/euro.png" alt="Logo Euroart" class="sidebar-logo">
            </div>
            
            <div class="user-info" style="flex-direction: column; align-items: center; gap: 5px;">
                <i class="fas fa-user-circle" style="font-size: 3em; margin-bottom: 5px; color: var(--cor-principal);"></i>
                <span id="nome-usuario-logado">Olá, ${nomeAdmin}</span>
                <span class="user-cargo">${cargoDisplay}</span>
            </div>

            <ul class="sidebar-menu">
                <li id="menu-dashboard" onclick="window.location.href='index.html'"><i class="fas fa-chart-line"></i> Dashboard</li>
                <li id="menu-conferencia" onclick="window.location.href='conferencia.html'"><i class="fas fa-box-open"></i> Conferência em Execução</li>
                <li id="menu-historico" onclick="window.location.href='historico.html'"><i class="fas fa-history"></i> Histórico</li>
                <li id="menu-minutas" onclick="window.location.href='minutas.html'"><i class="fas fa-file-pdf"></i> Minutas Impressas</li>
                
                ${menuUsuariosHTML}
            </ul>

            <button class="logout-btn" onclick="fazerLogout()">
                <i class="fas fa-sign-out-alt"></i> Sair
            </button>
        </aside>
    `;

    // Insere o menu dentro do container flexível (lado a lado com o conteúdo)
    const appLayout = document.querySelector('.app-layout');
    if (appLayout) {
        appLayout.insertAdjacentHTML('afterbegin', menuHTML);
    } else {
        document.body.insertAdjacentHTML('afterbegin', menuHTML);
    }

    // Marca o botão atual como ativo (verde/azul)
    if (itemAtivoId) {
        const itemAtivo = document.getElementById(itemAtivoId);
        if (itemAtivo) {
            itemAtivo.classList.add('active');
        }
    }
}