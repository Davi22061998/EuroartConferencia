import { Router } from 'express';
import { BalancaController } from '../controllers/BalancaController';

const router = Router();

// Endpoint liberado para o ESP32 postar o peso via rede local
router.post('/peso', BalancaController.receberPeso);

// Endpoint para a tela consultar o peso atual
router.get('/peso', BalancaController.obterPeso);

export default router;