import { Router } from 'express';
import { AuthController } from '../controllers/AuthController';

const router = Router();

router.get('/check-setup', AuthController.checkSetup);
router.post('/registrar', AuthController.registrar);
router.post('/login', AuthController.login);

export default router;