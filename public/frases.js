// public/frases.js

const frasesMotivacionais = [
    { texto: "Tudo o que fizerem, façam de todo o coração, como para o Senhor, e não para os homens.", autor: "Colossenses 3:23" },
    { texto: "O sucesso é a soma de pequenos esforços repetidos dia após dia.", autor: "Robert Collier" },
    { texto: "Não sabendo que era impossível, foi lá e fez.", autor: "Jean Cocteau" },
    { texto: "Consagre ao Senhor tudo o que você faz, e os seus planos serão bem-sucedidos.", autor: "Provérbios 16:3" },
    { texto: "A persistência é o caminho do êxito.", autor: "Charles Chaplin" },
    { texto: "Esforça-te, e tem bom ânimo; não temas, nem te espantes; porque o Senhor teu Deus é contigo.", autor: "Josué 1:9" },
    { texto: "A única maneira de fazer um excelente trabalho é amar o que você faz.", autor: "Steve Jobs" },
    { texto: "A qualidade não é um ato, é um hábito.", autor: "Aristóteles" },
    { texto: "Tudo posso naquele que me fortalece.", autor: "Filipenses 4:13" },
    { texto: "Grandes coisas nunca vêm de zonas de conforto.", autor: "Roy T. Bennett" },
    { texto: "O Senhor é o meu pastor; nada me faltará.", autor: "Salmos 23:1" },
    { texto: "A determinação de hoje é o sucesso de amanhã.", autor: "Anônimo" },
    { texto: "O que você faz hoje pode melhorar todos os seus amanhãs.", autor: "Ralph Marston" },
    { texto: "O ferro se afia com o ferro, e o homem afia o seu próximo.", autor: "Provérbios 27:17" },
    { texto: "Você nunca é velho demais para definir outra meta ou sonhar um novo sonho.", autor: "C.S. Lewis" },
    { texto: "Porque Deus não nos deu o espírito de temor, mas de fortaleza, de amor e de moderação.", autor: "2 Timóteo 1:7" },
    { texto: "A excelência é fazer uma coisa comum de uma maneira incomum.", autor: "Booker T. Washington" },
    { texto: "Confie no Senhor de todo o seu coração e não se apoie em seu próprio entendimento.", autor: "Provérbios 3:5" },
    { texto: "Se você quer ir rápido, vá sozinho. Se quer ir longe, vá em grupo.", autor: "Provérbio Africano" },
    { texto: "A esperança que se adia faz adoecer o coração, mas o desejo alcançado é árvore de vida.", autor: "Provérbios 13:12" },
    { texto: "Mente firme, alma limpa e foco nos objetivos.", autor: "Anônimo" },
    { texto: "A paz de Deus, que excede todo o entendimento, guardará os seus corações e as suas mentes.", autor: "Filipenses 4:7" },
    { texto: "O único lugar onde o sucesso vem antes do trabalho é no dicionário.", autor: "Vidal Sassoon" },
    { texto: "Que a força da determinação supere a fraqueza da dúvida.", autor: "Anônimo" },
    { texto: "Pois onde estiver o seu tesouro, aí também estará o seu coração.", autor: "Mateus 6:21" },
    { texto: "Grandes resultados requerem grandes ambições e trabalho constante.", autor: "Heráclito" },
    { texto: "Deus é o nosso refúgio e fortaleza, socorro bem presente na angústia.", autor: "Salmos 46:1" },
    { texto: "Faça o melhor que puder até saber mais. Quando souber mais, faça melhor.", autor: "Maya Angelou" },
    { texto: "Seja forte e corajoso! Não se apavore nem desanime.", autor: "Josué 1:9" },
    { texto: "A disciplina é a ponte entre metas e realizações.", autor: "Jim Rohn" },
    { texto: "Bendito o homem que confia no Senhor e cuja esperança é o Senhor.", autor: "Jeremias 17:7" },
    { texto: "Trabalhe em silêncio e deixe que o seu sucesso faça barulho.", autor: "Frank Ocean" },
    { texto: "O coração do homem planeja o seu caminho, mas o Senhor lhe dirige os passos.", autor: "Provérbios 16:9" },
    { texto: "Nenhum obstáculo é grande demais quando a vontade de vencer é maior.", autor: "Anônimo" },
    { texto: "O que a mão achar para fazer, faça-o com todas as suas forças.", autor: "Eclesiastes 9:10" },
    { texto: "Pequenas atitudes diárias constroem um futuro extraordinário.", autor: "Anônimo" },
    { texto: "Os que esperam no Senhor renovarão as suas forças e voarão como águias.", autor: "Isaías 40:31" },
    { texto: "Você é capaz de mais coisas do que imagina.", autor: "Anônimo" },
    { texto: "Guarda o teu coração, porque dele procedem as fontes da vida.", autor: "Provérbios 4:23" },
    { texto: "A sabedoria constrói a casa, e pelo entendimento ela se firma.", autor: "Provérbios 24:3" }
];

function obterFraseDoDia() {
    const hoje = new Date();
    const diaDoAno = Math.floor((hoje - new Date(hoje.getFullYear(), 0, 0)) / 1000 / 60 / 60 / 24);
    const index = diaDoAno % frasesMotivacionais.length;
    return frasesMotivacionais[index];
}

function renderizarFooter() {
    const frase = obterFraseDoDia();
    const anoAtual = new Date().getFullYear();

    const footerHTML = `
        <footer class="site-footer">
            <div class="footer-quote">
                <p><em>"${frase.texto}"</em></p>
                <span>- ${frase.autor}</span>
            </div>
            <div class="footer-copy">
                &copy; ${anoAtual} Conferência Euroart. Todos os direitos reservados.
            </div>
        </footer>
    `;

    const mainContent = document.querySelector('.main-content');
    if (mainContent) {
        mainContent.insertAdjacentHTML('beforeend', footerHTML);
    }
}

document.addEventListener('DOMContentLoaded', renderizarFooter);