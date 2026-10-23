import { Router } from 'express';
import { ParametrizacaoController } from '../controllers/ParametrizacaoController';
import { verificarToken } from '../middlewares/auth';

const router = Router();

router.use(verificarToken);

// Caixas / Embalagens
router.get('/caixas', ParametrizacaoController.listarCaixas);
router.post('/caixas', ParametrizacaoController.salvarCaixa);
router.put('/caixas/:id', ParametrizacaoController.salvarCaixa);
router.delete('/caixas/:id', ParametrizacaoController.excluirCaixa);

// SKUs / Produtos
router.get('/skus', ParametrizacaoController.listarSkus);
router.post('/skus', ParametrizacaoController.salvarSku);
router.put('/skus/:id', ParametrizacaoController.salvarSku);
router.delete('/skus/:id', ParametrizacaoController.excluirSku);

// Aliases para /produtos
router.get('/produtos', ParametrizacaoController.listarSkus);
router.post('/produtos', ParametrizacaoController.salvarSku);
router.put('/produtos/:id', ParametrizacaoController.salvarSku);
router.delete('/produtos/:id', ParametrizacaoController.excluirSku);

// Regras ICMS / DIFAL
router.get('/icms', ParametrizacaoController.listarRegrasIcms);
router.post('/icms', ParametrizacaoController.salvarRegraIcms);
router.put('/icms', ParametrizacaoController.salvarRegraIcms);

export default router;