import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import path from 'path';
import authRoutes from './routes/auth.routes';
import usuarioRoutes from './routes/usuario.routes';
import parametrizacaoRoutes from './routes/parametrizacao.routes';
import conferenciaRoutes from './routes/conferencia.routes';
import balancaRoutes from './routes/balanca.routes';
import sequelize from './config/database';

dotenv.config();

const app = express();

app.use(cors());
app.use(express.json({ limit: '20mb' }));
app.use(express.static(path.join(__dirname, '../public')));

// Rotas da API
app.use('/api/auth', authRoutes);
app.use('/api/usuarios', usuarioRoutes);
app.use('/api/parametrizacao', parametrizacaoRoutes);
app.use('/api/conferencias', conferenciaRoutes);
app.use('/api/balanca', balancaRoutes);

app.get('/health', (req, res) => {
  res.json({ status: 'API Euroart Conferência rodando perfeitamente!' });
});

const PORT = process.env.PORT || 3000;

sequelize.authenticate().then(() => {
  console.log('📦 Conexão com o banco de dados MySQL estabelecida com sucesso!');
  app.listen(PORT, () => {
    console.log(`🚀 Servidor rodando na porta ${PORT}`);
    console.log(`🌐 Acesse em: http://localhost:${PORT}/login.html`);
  });
}).catch((err) => {
  console.error('❌ Erro ao conectar ao banco de dados:', err);
});