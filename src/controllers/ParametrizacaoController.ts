import { Request, Response } from 'express';
import SkuProduto from '../models/SkuProduto';
import CaixaEmbalagem from '../models/CaixaEmbalagem';
import RegraCaixaSku from '../models/RegraCaixaSku';

export class ParametrizacaoController {
  // --- SKUs ---
  static async listarSkus(req: Request, res: Response): Promise<void> {
    try {
      const skus = await SkuProduto.findAll({
        include: [{ model: RegraCaixaSku, as: 'regras_caixa', include: [{ model: CaixaEmbalagem, as: 'caixa' }] }],
        order: [['nome_produto', 'ASC']]
      });
      res.status(200).json(skus);
    } catch (error: any) { res.status(500).json({ erro: error.message }); }
  }

  static async salvarSku(req: Request, res: Response): Promise<void> {
    try {
      const { id, codigo_sku, nome_produto, peso_unitario_gramas, tolerancia_peso_porcento } = req.body;
      if (!codigo_sku || !nome_produto || peso_unitario_gramas === undefined) {
        res.status(400).json({ erro: 'Código SKU, Nome e Peso são obrigatórios.' }); return;
      }
      let sku;
      if (id) {
        sku = await SkuProduto.findByPk(id);
        if (!sku) { res.status(404).json({ erro: 'SKU não encontrado.' }); return; }
        await sku.update({ codigo_sku, nome_produto, peso_unitario_gramas, tolerancia_peso_porcento });
      } else {
        sku = await SkuProduto.create({ codigo_sku, nome_produto, peso_unitario_gramas, tolerancia_peso_porcento });
      }
      res.status(201).json({ mensagem: 'SKU salvo com sucesso!', sku });
    } catch (error: any) { res.status(400).json({ erro: error.message }); }
  }

  static async excluirSku(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      await RegraCaixaSku.destroy({ where: { sku_id: id } }); // Remove vínculos primeiro
      await SkuProduto.destroy({ where: { id } });
      res.status(200).json({ mensagem: 'SKU excluído com sucesso!' });
    } catch (error: any) { res.status(500).json({ erro: error.message }); }
  }

  // --- CAIXAS ---
  static async listarCaixas(req: Request, res: Response): Promise<void> {
    try {
      const caixas = await CaixaEmbalagem.findAll({ order: [['nome', 'ASC']] });
      res.status(200).json(caixas);
    } catch (error: any) { res.status(500).json({ erro: error.message }); }
  }

  static async salvarCaixa(req: Request, res: Response): Promise<void> {
    try {
      const { id, nome, peso_gramas, descricao } = req.body;
      if (!nome || peso_gramas === undefined) {
        res.status(400).json({ erro: 'Nome e peso são obrigatórios.' }); return;
      }
      let caixa;
      if (id) {
        caixa = await CaixaEmbalagem.findByPk(id);
        if (!caixa) { res.status(404).json({ erro: 'Caixa não encontrada.' }); return; }
        await caixa.update({ nome, peso_gramas, descricao });
      } else {
        caixa = await CaixaEmbalagem.create({ nome, peso_gramas, descricao });
      }
      res.status(201).json({ mensagem: 'Caixa salva com sucesso!', caixa });
    } catch (error: any) { res.status(400).json({ erro: error.message }); }
  }

  static async excluirCaixa(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      await RegraCaixaSku.destroy({ where: { caixa_id: id } }); // Remove vínculos primeiro
      await CaixaEmbalagem.destroy({ where: { id } });
      res.status(200).json({ mensagem: 'Caixa excluída com sucesso!' });
    } catch (error: any) { res.status(500).json({ erro: error.message }); }
  }

  // --- REGRAS CAIXA / SKU ---
  static async salvarRegraCaixa(req: Request, res: Response): Promise<void> {
    try {
      const { sku_id, caixa_id, qtd_minima, qtd_maxima } = req.body;
      if (!sku_id || !caixa_id || !qtd_maxima) {
        res.status(400).json({ erro: 'SKU, Caixa e Quantidade Máxima obrigatórios.' }); return;
      }
      const regra = await RegraCaixaSku.create({ sku_id, caixa_id, qtd_minima: qtd_minima || 1, qtd_maxima });
      res.status(201).json({ mensagem: 'Regra de embalagem vinculada com sucesso!', regra });
    } catch (error: any) { res.status(400).json({ erro: error.message }); }
  }

  static async excluirRegra(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      await RegraCaixaSku.destroy({ where: { id } });
      res.status(200).json({ mensagem: 'Vínculo excluído com sucesso!' });
    } catch (error: any) { res.status(500).json({ erro: error.message }); }
  }
}