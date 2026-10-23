import { Router } from 'express';
import { ConferenciaController } from '../controllers/ConferenciaController';
import { verificarToken, apenasAdmin } from '../middlewares/auth';

const router = Router();

// Todas as rotas de conferência exigem usuário autenticado
router.use(verificarToken);

router.post('/importar', ConferenciaController.importarRemessa);
router.post('/conferir', ConferenciaController.conferirPacote);
router.post('/liberar-divergente', ConferenciaController.liberarDivergente);

router.get('/ativas', ConferenciaController.listarConferenciasAbertas);
router.get('/:id', ConferenciaController.obterConferencia);
router.post('/:id/interromper', ConferenciaController.interromper);
router.post('/:id/retomar', ConferenciaController.retomar);
router.post('/:id/finalizar', ConferenciaController.finalizar);

// Ações exclusivas para Administradores
router.post('/:id/remover-ultima-remessa', apenasAdmin, ConferenciaController.removerUltimaRemessa);
router.delete('/pacotes', apenasAdmin, ConferenciaController.excluirPacotes);

export default router;