import { Router } from 'express';
import { UsuarioController } from '../controllers/UsuarioController';
import { verificarToken, apenasAdmin } from '../middlewares/auth';

const router = Router();

// Todas as rotas abaixo exigem autenticação de Administrador
router.use(verificarToken, apenasAdmin);

router.post('/', UsuarioController.criar); // Rota segura de criação
router.get('/', UsuarioController.listar);
router.put('/:id', UsuarioController.atualizar);
router.delete('/:id', UsuarioController.excluir);

export default router;