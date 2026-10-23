import { Request, Response } from 'express';
import SkuProduto from '../models/SkuProduto';
import CaixaEmbalagem from '../models/CaixaEmbalagem';
import RegraIcms from '../models/RegraIcms';

export class ParametrizacaoController {
  // --- CAIXAS (EMBALAGENS) ---
  static async listarCaixas(req: Request, res: Response): Promise<void> {
    try {
      const caixas = await CaixaEmbalagem.findAll({ order: [['nome', 'ASC']] });
      res.status(200).json(caixas);
    } catch (error: any) {
      res.status(500).json({ erro: error.message });
    }
  }

  static async salvarCaixa(req: Request, res: Response): Promise<void> {
    try {
      const { id, codigo_sku, nome, peso_gramas, descricao } = req.body;

      if (!codigo_sku || !nome || peso_gramas === undefined || peso_gramas === null || peso_gramas === '') {
        res.status(400).json({ erro: 'Código SKU/Barcode, Nome e Peso da Caixa são obrigatórios.' });
        return;
      }

      const skuLimpo = String(codigo_sku).trim().toUpperCase();
      const nomeLimpo = String(nome).trim();
      const pesoNum = Number(peso_gramas);

      if (isNaN(pesoNum) || pesoNum <= 0) {
        res.status(400).json({ erro: 'O peso da caixa deve ser um número válido maior que zero.' });
        return;
      }

      const dadosCaixa: {
        codigo_sku: string;
        nome: string;
        peso_gramas: number;
        descricao?: string;
      } = {
        codigo_sku: skuLimpo,
        nome: nomeLimpo,
        peso_gramas: pesoNum
      };

      if (descricao && String(descricao).trim() !== '') {
        dadosCaixa.descricao = String(descricao).trim();
      }

      const idParam = req.params?.id || id;
      const idNum = idParam && !isNaN(Number(idParam)) ? Number(idParam) : null;

      if (idNum) {
        const caixa = await CaixaEmbalagem.findByPk(idNum);
        if (!caixa) {
          res.status(404).json({ erro: 'Caixa não encontrada para atualização.' });
          return;
        }
        await caixa.update(dadosCaixa);
        res.status(200).json({ mensagem: 'Caixa atualizada com sucesso!', caixa });
      } else {
        const caixaExistente = await CaixaEmbalagem.findOne({ where: { codigo_sku: skuLimpo } });
        if (caixaExistente) {
          res.status(400).json({ erro: `Já existe uma caixa cadastrada com o SKU/Barcode "${skuLimpo}".` });
          return;
        }

        const caixa = await CaixaEmbalagem.create(dadosCaixa);
        res.status(201).json({ mensagem: 'Caixa cadastrada com sucesso!', caixa });
      }
    } catch (error: any) {
      console.error('Erro ao salvar caixa:', error);
      res.status(400).json({ erro: error.message || 'Erro ao processar cadastro de caixa.' });
    }
  }

  static async excluirCaixa(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      const idNum = Number(id);
      if (!idNum || isNaN(idNum)) {
        res.status(400).json({ erro: 'ID de caixa inválido.' });
        return;
      }
      await CaixaEmbalagem.destroy({ where: { id: idNum } });
      res.status(200).json({ mensagem: 'Caixa excluída com sucesso!' });
    } catch (error: any) {
      res.status(500).json({ erro: error.message });
    }
  }

  // --- SKUs / PRODUTOS ---
  static async listarSkus(req: Request, res: Response): Promise<void> {
    try {
      const skus = await SkuProduto.findAll({ order: [['nome_produto', 'ASC']] });
      res.status(200).json(skus);
    } catch (error: any) {
      res.status(500).json({ erro: error.message });
    }
  }

  static async salvarSku(req: Request, res: Response): Promise<void> {
    try {
      const { id, codigo_sku, nome_produto, peso_unitario_gramas, tolerancia_peso_porcento } = req.body;

      if (!codigo_sku || !nome_produto || peso_unitario_gramas === undefined || peso_unitario_gramas === null || peso_unitario_gramas === '') {
        res.status(400).json({ erro: 'Código SKU, Nome do Produto e Peso Unitário são obrigatórios.' });
        return;
      }

      const skuLimpo = String(codigo_sku).trim().toUpperCase();
      const nomeLimpo = String(nome_produto).trim();
      const pesoNum = Number(peso_unitario_gramas);
      const tolNum = tolerancia_peso_porcento !== undefined && tolerancia_peso_porcento !== '' ? Number(tolerancia_peso_porcento) : 2.0;

      if (isNaN(pesoNum) || pesoNum <= 0) {
        res.status(400).json({ erro: 'O peso unitário deve ser um número válido maior que zero.' });
        return;
      }

      const dadosSku = {
        codigo_sku: skuLimpo,
        nome_produto: nomeLimpo,
        peso_unitario_gramas: pesoNum,
        tolerancia_peso_porcento: tolNum
      };

      const idParam = req.params?.id || id;
      const idNum = idParam && !isNaN(Number(idParam)) ? Number(idParam) : null;

      if (idNum) {
        const sku = await SkuProduto.findByPk(idNum);
        if (!sku) {
          res.status(404).json({ erro: 'Produto SKU não encontrado para atualização.' });
          return;
        }
        await sku.update(dadosSku);
        res.status(200).json({ mensagem: 'Produto SKU atualizado com sucesso!', sku });
      } else {
        const skuExistente = await SkuProduto.findOne({ where: { codigo_sku: skuLimpo } });
        if (skuExistente) {
          res.status(400).json({ erro: `Já existe um produto cadastrado com o SKU "${skuLimpo}".` });
          return;
        }

        const sku = await SkuProduto.create(dadosSku);
        res.status(201).json({ mensagem: 'Produto SKU cadastrado com sucesso!', sku });
      }
    } catch (error: any) {
      console.error('Erro ao salvar SKU:', error);
      res.status(400).json({ erro: error.message || 'Erro ao processar cadastro de SKU.' });
    }
  }

  static async excluirSku(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      const idNum = Number(id);
      if (!idNum || isNaN(idNum)) {
        res.status(400).json({ erro: 'ID de SKU inválido.' });
        return;
      }
      await SkuProduto.destroy({ where: { id: idNum } });
      res.status(200).json({ mensagem: 'Produto SKU excluído com sucesso!' });
    } catch (error: any) {
      res.status(500).json({ erro: error.message });
    }
  }

  // --- REGRAS ICMS / DIFAL ---
  static async listarRegrasIcms(req: Request, res: Response): Promise<void> {
    try {
      const regras = await RegraIcms.findAll({ order: [['uf', 'ASC']] });
      res.status(200).json(regras);
    } catch (error: any) {
      res.status(500).json({ erro: error.message });
    }
  }

  static async salvarRegraIcms(req: Request, res: Response): Promise<void> {
    try {
      const { uf, exige_guia } = req.body;
      if (!uf) {
        res.status(400).json({ erro: 'UF é obrigatória.' });
        return;
      }
      const ufLimpa = String(uf).trim().toUpperCase();
      let regra = await RegraIcms.findByPk(ufLimpa);
      if (regra) {
        regra.exige_guia = Boolean(exige_guia);
        await regra.save();
      } else {
        regra = await RegraIcms.create({ uf: ufLimpa, exige_guia: Boolean(exige_guia) });
      }
      res.status(200).json({ mensagem: 'Regra ICMS atualizada com sucesso!', regra });
    } catch (error: any) {
      res.status(500).json({ erro: error.message });
    }
  }

  // Aliases para compatibilidade total com rotas antigas
  static cadastrarCaixa = ParametrizacaoController.salvarCaixa;
  static criarCaixa = ParametrizacaoController.salvarCaixa;
  static atualizarCaixa = ParametrizacaoController.salvarCaixa;
  static deletarCaixa = ParametrizacaoController.excluirCaixa;

  static listarProdutos = ParametrizacaoController.listarSkus;
  static cadastrarSku = ParametrizacaoController.salvarSku;
  static criarSku = ParametrizacaoController.salvarSku;
  static atualizarSku = ParametrizacaoController.salvarSku;
  static salvarProduto = ParametrizacaoController.salvarSku;
  static cadastrarProduto = ParametrizacaoController.salvarSku;
  static excluirProduto = ParametrizacaoController.excluirSku;
  static deletarSku = ParametrizacaoController.excluirSku;

  static listarRegras = ParametrizacaoController.listarRegrasIcms;
  static salvarRegra = ParametrizacaoController.salvarRegraIcms;
  static atualizarRegraIcms = ParametrizacaoController.salvarRegraIcms;
}

export default ParametrizacaoController;