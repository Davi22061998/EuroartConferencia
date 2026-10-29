# Guia de Deploy e Produção

Passo a passo para implantar o Sistema de Expedição num servidor local (Windows Server ou Linux) dentro da infraestrutura da Euroart.

## 1. Preparação do Servidor
1.  Instalar o **Node.js** (v18 LTS ou superior).
2.  Instalar o **MySQL Server** (v8.0+) e criar uma base de dados vazia chamada `euroart_db`.
3.  (Opcional, mas recomendado) Instalar o **Git** para facilitar as atualizações de código.

## 2. Instalação da Aplicação
Clone o repositório e instale as dependências de produção:
```bash
git clone
cd EuroartConferencia
npm install --omit=dev
```

## 3. Variáveis de Ambiente
Crie o ficheiro `.env` na raiz:
```env
PORT=80
DB_HOST=127.0.0.1
DB_USER=root
DB_PASS=senha_forte_mysql
DB_NAME=euroart_db
DB_DIALECT=mysql
JWT_SECRET=chave_secreta_super_segura
```

## 4. Migrations e Dados Iniciais
Prepare a base de dados estruturada:
```bash
npx sequelize-cli db:migrate
npx sequelize-cli db:seed:all
```
*(O seed deve gerar o primeiro utilizador admin padrão).*

## 5. Mantendo o Servidor Online (Daemon)
Nunca execute a aplicação com `node src/server.js` diretamente num terminal para produção, pois ele fecha se a janela for fechada. Utilize o **PM2**:

```bash
# Instalar o PM2 globalmente
npm install -g pm2

# Iniciar o sistema pelo PM2
pm2 start dist/server.js --name "Euroart_App"

# Configurar para iniciar automaticamente com o Windows/Linux
pm2 startup
pm2 save
```

## 6. Acesso Local
A partir de agora, qualquer computador na rede local (Wi-Fi/Cabo) da empresa poderá aceder ao sistema digitando o IP do servidor no navegador (Ex: `http://192.168.0.100`).