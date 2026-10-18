import { Router } from 'express';
import { UsuarioController } from '../controllers/UsuarioController';
import { verificarToken, apenasAdmin } from '../middlewares/auth';

const router = Router();

// Todas as rotas de usuários exigem autenticação de Admin
router.use(verificarToken, apenasAdmin);

router.get('/', UsuarioController.listar);
router.put('/:id', UsuarioController.atualizar);
router.delete('/:id', UsuarioController.excluir);

export default router;