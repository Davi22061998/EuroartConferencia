import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import path from 'path';
import authRoutes from './routes/auth.routes';
import usuarioRoutes from './routes/usuario.routes';
import parametrizacaoRoutes from './routes/parametrizacao.routes';
import sequelize from './config/database';

dotenv.config();

const app = express();

app.use(cors());
app.use(express.json());
app.use(express.static(path.join(__dirname, '../public')));

// Rotas da API
app.use('/api/auth', authRoutes);
app.use('/api/usuarios', usuarioRoutes);
app.use('/api/parametrizacao', parametrizacaoRoutes);

app.get('/health', (req, res) => {
  res.json({ status: 'API do Euroart rodando perfeitamente!' });
});

const PORT = process.env.PORT || 3000;

// Sincroniza tabelas do Sequelize com o banco de dados
sequelize.sync({ alter: true }).then(() => {
  console.log('📦 Conexão e tabelas sincronizadas com o banco de dados!');
  app.listen(PORT, () => {
    console.log(`🚀 Servidor rodando na porta ${PORT}`);
    console.log(`🌐 Acesse o sistema em: http://localhost:${PORT}/login.html`);
  });
}).catch((err) => {
  console.error('❌ Erro ao conectar/sincronizar banco:', err);
});