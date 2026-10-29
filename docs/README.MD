# 📦 Sistema de Expedição e Conferência - Euroart

![Status](https://img.shields.io/badge/Status-Produção-success)
![Node.js](https://img.shields.io/badge/Node.js-v18+-green)
![License](https://img.shields.io/badge/Licença-MIT-blue)

O **Sistema de Expedição Euroart** é uma plataforma logística completa desenvolvida para garantir a integridade e precisão no envio de mercadorias. O sistema valida os pacotes de uma remessa comparando o peso esperado dos produtos (SKUs) e da embalagem com o peso real aferido por uma balança conectada via hardware (ESP32).

Desenvolvido como Projeto Integrador (PI) pela Fatec Indaiatuba para a empresa Euroart.

---

## ✨ Principais Funcionalidades

- **Integração de Hardware (IoT):** Leitura de peso em tempo real através de um microcontrolador ESP32 conectado à rede local.
- **Importação de Remessas:** Processamento de ficheiros JSON contendo Notas Fiscais (NFs), Chaves de Acesso e lista de SKUs.
- **Conferência Bip a Bip:** Validação do pacote por código de barras/QR Code, cruzando a leitura da balança com a tolerância de peso cadastrada.
- **Auditoria e Bloqueios:** Sistema inteligente que exige libertação por um Administrador/Gerente caso um pacote apresente divergência de peso em 2 tentativas seguidas.
- **Geração de Minutas de Transporte:** Emissão automatizada de PDFs contendo o resumo da carga, status e os respetivos SKUs conferidos.
- **Dashboard Analítico:** Gráficos interativos de KPI (Volumes, Status, Transportadoras, SKUs mais expedidos) e Histórico Geral de auditoria.
- **Controlo de Acessos:** Autenticação JWT com perfis de utilizador (Operador vs. Administrador).

---

## 🛠️ Tecnologias e Frameworks

O projeto utiliza uma arquitetura MVC (Model-View-Controller) orientada a serviços RESTful, dividida entre um backend robusto em Node.js e um frontend rápido sem dependência de frameworks pesados (Vanilla).

### Backend (API)
- **[Node.js](https://nodejs.org/) & [Express](https://expressjs.com/):** Motor e framework web para a criação das rotas e gestão de requisições HTTP.
- **[Sequelize](https://sequelize.org/):** ORM (Object-Relational Mapper) utilizado para a modelagem da base de dados SQL, garantindo a integridade relacional.
- **[PDFKit](https://pdfkit.org/):** Biblioteca para a geração e formatação dinâmica dos PDFs (Minutas de Transporte).
- **[Bcrypt](https://www.npmjs.com/package/bcrypt) & [JSONWebToken (JWT)](https://jwt.io/):** Criptografia de senhas e geração de tokens seguros para sessões de utilizador.

### Frontend (Client-side)
- **HTML5 / CSS3 / JavaScript (Vanilla):** Interface modular, leve e sem necessidade de compilação (build tools).
- **[Chart.js](https://www.chartjs.org/):** Renderização de gráficos interativos no Dashboard.
- **FontAwesome:** Ícones vetoriais em toda a interface.

---

## ⚙️ Pré-requisitos e Bibliotecas

Para rodar este projeto localmente, precisarás de:
- **Node.js** (Versão 18 ou superior)
- **Base de Dados SQL** (MySQL, PostgreSQL ou SQLite configurado no seu dialeto Sequelize)
- **NPM** ou **Yarn** (Gestores de pacotes)

As principais dependências do projeto (listadas no `package.json`) são:
```json
"dependencies": {
  "express": "^4.x",
  "sequelize": "^6.x",
  "mysql2": "^3.x", 
  "bcrypt": "^5.x",
  "jsonwebtoken": "^9.x",
  "pdfkit": "^0.x",
  "cors": "^2.x",
  "dotenv": "^16.x"
}