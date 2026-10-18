import { Router } from 'express';
import { ParametrizacaoController } from '../controllers/ParametrizacaoController';
import { verificarToken, apenasAdmin } from '../middlewares/auth';

const router = Router();

// Proteção global para administradores
router.use(verificarToken, apenasAdmin);

// SKUs
router.get('/skus', ParametrizacaoController.listarSkus);
router.post('/skus', ParametrizacaoController.salvarSku);
router.delete('/skus/:id', ParametrizacaoController.excluirSku);

// Caixas
router.get('/caixas', ParametrizacaoController.listarCaixas);
router.post('/caixas', ParametrizacaoController.salvarCaixa);
router.delete('/caixas/:id', ParametrizacaoController.excluirCaixa);

// Regras
router.post('/regras-caixa', ParametrizacaoController.salvarRegraCaixa);
router.delete('/regras-caixa/:id', ParametrizacaoController.excluirRegra);

export default router;