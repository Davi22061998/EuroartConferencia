import { Request, Response } from 'express';
import { AuthService } from '../services/AuthService';

export class AuthController {
  static async checkSetup(req: Request, res: Response): Promise<void> {
    try {
      const setupStatus = await AuthService.checkSetup();
      res.status(200).json(setupStatus);
    } catch (error: any) {
      res.status(500).json({ erro: error.message });
    }
  }

  static async registrar(req: Request, res: Response): Promise<void> {
    try {
      const { nome, email, senha, perfil } = req.body;

      if (!nome || !email || !senha) {
        res.status(400).json({ erro: 'Nome, e-mail e senha são obrigatórios.' });
        return;
      }

      const usuario = await AuthService.registrar(nome, email, senha, perfil);
      res.status(201).json({ mensagem: 'Usuário registrado com sucesso!', usuario });
    } catch (error: any) {
      res.status(400).json({ erro: error.message });
    }
  }

  static async login(req: Request, res: Response): Promise<void> {
    try {
      const { email, senha } = req.body;

      if (!email || !senha) {
        res.status(400).json({ erro: 'E-mail e senha são obrigatórios.' });
        return;
      }

      const dadosLogin = await AuthService.login(email, senha);
      res.status(200).json(dadosLogin);
    } catch (error: any) {
      res.status(401).json({ erro: error.message });
    }
  }
}