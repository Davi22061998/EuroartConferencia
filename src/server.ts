import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import path from 'path';
import authRoutes from './routes/auth.routes';
import sequelize from './config/database';

dotenv.config();

const app = express();

// Middlewares
app.use(cors());
app.use(express.json()); // Permite o express ler JSON no body

// Servir os arquivos estáticos do frontend (Pasta Public)
// O path.join garante que o caminho funcione independente de onde o terminal foi aberto
app.use(express.static(path.join(__dirname, '../public')));

// Rotas da API
app.use('/api/auth', authRoutes);

// Rota de teste da API
app.get('/health', (req, res) => {
  res.json({ status: 'API do Euroart rodando perfeitamente!' });
});

// Inicia o Servidor e testa a conexão com o banco
const PORT = process.env.PORT || 3000;

sequelize.authenticate().then(() => {
  console.log('📦 Conexão com o banco de dados estabelecida!');
  app.listen(PORT, () => {
    console.log(`🚀 Servidor rodando na porta ${PORT}`);
    console.log(`🌐 Acesse o sistema em: http://localhost:${PORT}/login.html`);
  });
}).catch((err) => {
  console.error('❌ Erro ao conectar no banco:', err);
});