(function () {
    const THEME_KEY = 'euroart-theme';

    function obterTemaInicial() {
        const salvo = localStorage.getItem(THEME_KEY);
        if (salvo === 'dark' || salvo === 'light') return salvo;
        return window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches
            ? 'dark'
            : 'light';
    }

    function aplicarTema(tema) {
        const temaValido = tema === 'dark' ? 'dark' : 'light';
        document.documentElement.setAttribute('data-theme', temaValido);
        document.documentElement.style.colorScheme = temaValido;
        localStorage.setItem(THEME_KEY, temaValido);

        document.querySelectorAll('[data-theme-toggle]').forEach((botao) => {
            const escuro = temaValido === 'dark';
            botao.innerHTML = escuro
                ? '<i class="fas fa-sun" aria-hidden="true"></i><span>Modo claro</span>'
                : '<i class="fas fa-moon" aria-hidden="true"></i><span>Modo escuro</span>';
            botao.setAttribute('aria-label', escuro ? 'Ativar modo claro' : 'Ativar modo escuro');
            botao.setAttribute('title', escuro ? 'Ativar modo claro' : 'Ativar modo escuro');
            botao.setAttribute('aria-pressed', String(escuro));
        });
    }

    window.alternarTema = function () {
        const atual = document.documentElement.getAttribute('data-theme') || obterTemaInicial();
        aplicarTema(atual === 'dark' ? 'light' : 'dark');
    };

    window.aplicarTema = aplicarTema;
    aplicarTema(obterTemaInicial());
})();