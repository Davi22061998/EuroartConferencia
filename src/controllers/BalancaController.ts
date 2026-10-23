import { Request, Response } from 'express';
import BalancaService from '../services/BalancaService';

export class BalancaController {
  // Endpoint acionado pelo ESP32 via Wi-Fi
  static async receberPeso(req: Request, res: Response): Promise<void> {
    try {
      const { peso_gramas } = req.body;
      if (peso_gramas === undefined || isNaN(Number(peso_gramas))) {
        res.status(400).json({ erro: 'Peso em gramas é obrigatório e deve ser numérico.' });
        return;
      }

      BalancaService.registrarPeso(Number(peso_gramas));
      res.status(200).json({ mensagem: 'Peso atualizado com sucesso!', peso: Number(peso_gramas) });
    } catch (error: any) {
      res.status(500).json({ erro: error.message });
    }
  }

  // Endpoint consultado pelo Frontend para exibir o peso em tempo real
  static async obterPeso(req: Request, res: Response): Promise<void> {
    try {
      const leitura = BalancaService.obterPesoAtual();
      res.status(200).json(leitura);
    } catch (error: any) {
      res.status(500).json({ erro: error.message });
    }
  }
}