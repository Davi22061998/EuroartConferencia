import { Request, Response } from 'express';
import { Op } from 'sequelize';
import bcrypt from 'bcrypt';
import sequelize from '../config/database';
import Conferencia from '../models/Conferencia';
import Remessa from '../models/Remessa';
import Pacote from '../models/Pacote';
import ItemPacote from '../models/ItemPacote';
import CaixaEmbalagem from '../models/CaixaEmbalagem';
import SkuProduto from '../models/SkuProduto';
import RegraIcms from '../models/RegraIcms';
import Usuario from '../models/Usuario';
import BalancaService from '../services/BalancaService';

export class ConferenciaController {
  // 1. IMPORTAR REMESSA (JSON)
  static async importarRemessa(req: Request, res: Response): Promise<void> {
    const t = await sequelize.transaction();
    try {
      const { arquivo_nome, pacotes } = req.body;
      const usuarioLogado = (req as any).usuario;

      if (!usuarioLogado) {
        await t.rollback();
        res.status(401).json({ erro: 'Usuário não autenticado.' });
        return;
      }

      if (!arquivo_nome || !Array.isArray(pacotes) || pacotes.length === 0) {
        await t.rollback();
        res.status(400).json({ erro: 'Arquivo JSON inválido ou lista de pacotes vazia.' });
        return;
      }

      // Validação: Transportadora única no arquivo JSON
      const transportadoras = [...new Set(pacotes.map((p: any) => p.transportadora).filter(Boolean))];
      if (transportadoras.length === 0) {
        await t.rollback();
        res.status(400).json({ erro: 'Nenhuma transportadora identificada no JSON.' });
        return;
      }
      if (transportadoras.length > 1) {
        await t.rollback();
        res.status(400).json({ erro: 'O arquivo contém múltiplas transportadoras. Cada remessa deve conter apenas uma transportadora.' });
        return;
      }

      const transportadora = transportadoras[0] as string;

      // Busca conferência aberta ou interrompida daquela transportadora
      let conferencia = await Conferencia.findOne({
        where: {
          transportadora,
          status: { [Op.in]: ['em_andamento', 'interrompida'] }
        },
        transaction: t
      });

      if (!conferencia) {
        conferencia = await Conferencia.create({
          transportadora,
          status: 'em_andamento',
          usuario_id: usuarioLogado.id,
          data_inicio: new Date()
        }, { transaction: t });
      } else if (conferencia.status === 'interrompida') {
        conferencia.status = 'em_andamento';
        await conferencia.save({ transaction: t });
      }

      // Trava de integridade: Arquivo com mesmo nome já importado nesta conferência
      const remessaExistente = await Remessa.findOne({
        where: {
          conferencia_id: conferencia.id,
          arquivo_nome
        },
        transaction: t
      });

      if (remessaExistente) {
        await t.rollback();
        res.status(409).json({ erro: `O arquivo "${arquivo_nome}" já foi importado anteriormente nesta conferência.` });
        return;
      }

      // Determina o número sequencial da remessa
      const totalRemessas = await Remessa.count({
        where: { conferencia_id: conferencia.id },
        transaction: t
      });
      const proximoNumeroRemessa = totalRemessas + 1;

      // Criação da Remessa
      const novaRemessa = await Remessa.create({
        conferencia_id: conferencia.id,
        numero_remessa: proximoNumeroRemessa,
        arquivo_nome,
        total_pacotes: pacotes.length,
        data_importacao: new Date()
      }, { transaction: t });

      // Mapeamento de UFs com exigência de DIFAL
      const regrasIcms = await RegraIcms.findAll({ transaction: t });
      const ufsComGuia = new Set(regrasIcms.filter(r => r.exige_guia).map(r => r.uf.toUpperCase()));

      // Coleta todas as NFs do JSON para validação em lote
      const numerosNfJson = pacotes.map((p: any) => String(p.numero_nf));
      const chavesAcessoJson = pacotes.map((p: any) => String(p.chave_acesso));

      // Busca pacotes já existentes em conferências abertas
      const pacotesExistentes = await Pacote.findAll({
        where: {
          [Op.or]: [
            { numero_nf: { [Op.in]: numerosNfJson } },
            { chave_acesso: { [Op.in]: chavesAcessoJson } }
          ]
        },
        include: [{
          model: Conferencia,
          as: 'conferencia',
          where: { status: { [Op.in]: ['em_andamento', 'interrompida'] } }
        }],
        transaction: t
      });

      const nfsExistentesSet = new Set(pacotesExistentes.map(p => p.numero_nf));
      const chavesExistentesSet = new Set(pacotesExistentes.map(p => p.chave_acesso));

      let adicionados = 0;
      let duplicados = 0;

      for (const p of pacotes) {
        const nfStr = String(p.numero_nf);
        const chaveStr = String(p.chave_acesso);
        const isDuplicado = nfsExistentesSet.has(nfStr) || chavesExistentesSet.has(chaveStr);

        const pacoteCriado = await Pacote.create({
          conferencia_id: conferencia.id,
          remessa_id: novaRemessa.id,
          chave_acesso: chaveStr,
          numero_nf: nfStr,
          razao_social: p.razao_social || 'Consumidor Final',
          descricao_produto: p.itens?.[0]?.descricao_produto || '',
          uf: (p.uf || 'SP').toUpperCase(),
          status: isDuplicado ? 'duplicado' : 'pendente',
          possui_guia_icms: ufsComGuia.has((p.uf || '').toUpperCase()),
          tentativas_peso: 0
        }, { transaction: t });

        if (isDuplicado) {
          duplicados++;
        } else {
          adicionados++;
          nfsExistentesSet.add(nfStr);
          chavesExistentesSet.add(chaveStr);
        }

        // Cadastro dos itens do lastro exclusivo da NF
        if (Array.isArray(p.itens) && p.itens.length > 0) {
          const itensParaCriar = p.itens.map((item: any) => ({
            pacote_id: pacoteCriado.id,
            codigo_sku: String(item.codigo_sku),
            descricao_produto: item.descricao_produto || '',
            quantidade: Number(item.quantidade) || 1
          }));
          await ItemPacote.bulkCreate(itensParaCriar, { transaction: t });
        }
      }

      await t.commit();

      res.status(201).json({
        mensagem: `Remessa ${proximoNumeroRemessa} importada com sucesso!`,
        conferencia_id: conferencia.id,
        remessa_id: novaRemessa.id,
        transportadora,
        pacotes_adicionados: adicionados,
        pacotes_duplicados: duplicados
      });
    } catch (error: any) {
      await t.rollback();
      res.status(500).json({ erro: error.message });
    }
  }

  // 2. BIPAGEM DE CAIXA + CHAVE DE ACESSO/NF + VALIDAÇÃO DE PESO
  static async conferirPacote(req: Request, res: Response): Promise<void> {
    try {
      const { conferencia_id, codigo_caixa, codigo_pacote, peso_balanca } = req.body;

      if (!conferencia_id || !codigo_caixa || !codigo_pacote) {
        res.status(400).json({ erro: 'ID da conferência, código da caixa e código do pacote são obrigatórios.' });
        return;
      }

      // 1. Busca a caixa de embalagem pelo SKU / Barcode lido
      const caixa = await CaixaEmbalagem.findOne({
        where: { codigo_sku: String(codigo_caixa).trim() }
      });
      if (!caixa) {
        res.status(404).json({ erro: `Caixa com SKU/código "${codigo_caixa}" não cadastrada no sistema.` });
        return;
      }

      // 2. Busca o pacote na conferência ativa
      const pacote = await Pacote.findOne({
        where: {
          conferencia_id: Number(conferencia_id),
          [Op.or]: [
            { chave_acesso: String(codigo_pacote).trim() },
            { numero_nf: String(codigo_pacote).trim() }
          ]
        },
        include: [{ model: ItemPacote, as: 'itens' }]
      });

      if (!pacote) {
        res.status(404).json({
          status: 'fora_remessa',
          erro: 'Pacote não pertence a esta conferência/remessa.'
        });
        return;
      }

      // 3. Validação de duplicidade
      if (pacote.status === 'ok' || pacote.status === 'liberado_divergente') {
        res.status(409).json({
          status: 'duplicado',
          mensagem: 'Pacote já conferido anteriormente.',
          pacote: {
            numero_nf: pacote.numero_nf,
            chave_acesso: pacote.chave_acesso,
            data_conferido: pacote.data_conferido,
            cliente: pacote.razao_social
          }
        });
        return;
      }

      // 4. Bloqueio por 2 erros consecutivos de peso
      if (pacote.status === 'bloqueado') {
        res.status(403).json({
          status: 'bloqueado',
          erro: 'Pacote travado por divergência de peso na 2ª tentativa. Requer autorização de um superior.'
        });
        return;
      }

      // 5. Cálculo do peso esperado estritamente para os itens deste pacote
      const itens = (pacote as any).itens || [];
      if (itens.length === 0) {
        res.status(400).json({ erro: 'Pacote sem itens vinculados na remessa.' });
        return;
      }

      let pesoProdutosEsperado = 0;
      let maiorTolerancia = 2.0;

      for (const item of itens) {
        const skuCadastrado = await SkuProduto.findOne({ where: { codigo_sku: item.codigo_sku } });
        if (!skuCadastrado) {
          res.status(400).json({
            erro: `O produto "${item.codigo_sku}" não possui peso cadastrado. Cadastre o SKU em Parametrização para efetivar a conferência.`
          });
          return;
        }

        pesoProdutosEsperado += Number(skuCadastrado.peso_unitario_gramas) * item.quantidade;
        if (Number(skuCadastrado.tolerancia_peso_porcento) > maiorTolerancia) {
          maiorTolerancia = Number(skuCadastrado.tolerancia_peso_porcento);
        }
      }

      const pesoTaraCaixa = Number(caixa.peso_gramas);
      const pesoEsperadoTotal = Number((pesoProdutosEsperado + pesoTaraCaixa).toFixed(2));

      // Obtenção do peso vindo da balança (payload ou serviço)
      const pesoLido = peso_balanca !== undefined ? Number(peso_balanca) : BalancaService.obterPesoAtual().peso_gramas;

      const margemAceitavel = pesoEsperadoTotal * (maiorTolerancia / 100);
      const pesoMinimo = pesoEsperadoTotal - margemAceitavel;
      const pesoMaximo = pesoEsperadoTotal + margemAceitavel;

      const pesoAprovado = pesoLido >= pesoMinimo && pesoLido <= pesoMaximo;

      pacote.caixa_id = caixa.id;
      pacote.peso_esperado_g = pesoEsperadoTotal;
      pacote.peso_lido_g = pesoLido;

      if (pesoAprovado) {
        pacote.status = 'ok';
        pacote.data_conferido = new Date();
        await pacote.save();

        res.status(200).json({
          status: 'ok',
          mensagem: 'Pacote conferido com sucesso!',
          pacote: {
            id: pacote.id,
            numero_nf: pacote.numero_nf,
            chave_acesso: pacote.chave_acesso,
            peso_esperado: pesoEsperadoTotal,
            peso_lido: pesoLido,
            possui_guia_icms: pacote.possui_guia_icms,
            status: pacote.status
          }
        });
        return;
      }

      // Tratamento de Reprovação de Peso
      pacote.tentativas_peso += 1;

      if (pacote.tentativas_peso >= 2) {
        pacote.status = 'bloqueado';
        await pacote.save();

        res.status(422).json({
          status: 'bloqueado',
          mensagem: 'Peso divergente na 2ª tentativa. Pacote travado. Exige liberação de superior com justificativa.',
          detalhes: {
            peso_esperado: pesoEsperadoTotal,
            peso_lido: pesoLido,
            faixa_aceita: `${pesoMinimo.toFixed(2)}g a ${pesoMaximo.toFixed(2)}g`,
            tentativas: pacote.tentativas_peso
          }
        });
        return;
      }

      pacote.status = 'divergente_peso';
      await pacote.save();

      res.status(422).json({
        status: 'divergente_peso',
        mensagem: 'Peso divergente! Abra fisicamente a caixa para conferir os produtos antes de tentar novamente.',
        detalhes: {
          peso_esperado: pesoEsperadoTotal,
          peso_lido: pesoLido,
          faixa_aceita: `${pesoMinimo.toFixed(2)}g a ${pesoMaximo.toFixed(2)}g`,
          tentativas: pacote.tentativas_peso
        }
      });
    } catch (error: any) {
      res.status(500).json({ erro: error.message });
    }
  }

  // 3. LIBERAÇÃO DE PACOTE TRAVADO (ADMIN / GERENTE COM SENHA)
  static async liberarDivergente(req: Request, res: Response): Promise<void> {
    try {
      const { pacote_id, email_superior, senha_superior, justificativa } = req.body;

      if (!pacote_id || !email_superior || !senha_superior || !justificativa) {
        res.status(400).json({ erro: 'ID do pacote, credenciais do superior e justificativa são obrigatórios.' });
        return;
      }

      const superior = await Usuario.findOne({ where: { email: email_superior } });
      if (!superior || superior.perfil !== 'admin') {
        res.status(403).json({ erro: 'Credenciais inválidas ou usuário não possui privilégios de superior.' });
        return;
      }

      const senhaValida = await bcrypt.compare(senha_superior, superior.senha_hash);
      if (!senhaValida) {
        res.status(403).json({ erro: 'Senha do superior incorreta.' });
        return;
      }

      const pacote = await Pacote.findByPk(Number(pacote_id));
      if (!pacote) {
        res.status(404).json({ erro: 'Pacote não encontrado.' });
        return;
      }

      pacote.status = 'liberado_divergente';
      pacote.justificativa_liberacao = justificativa;
      pacote.usuario_liberacao_id = superior.id;
      pacote.data_conferido = new Date();
      await pacote.save();

      res.status(200).json({
        mensagem: 'Pacote liberado com ressalva pelo superior!',
        pacote
      });
    } catch (error: any) {
      res.status(500).json({ erro: error.message });
    }
  }

  // 4. LISTAR CONFERÊNCIAS ABERTAS / INTERROMPIDAS
  static async listarConferenciasAbertas(req: Request, res: Response): Promise<void> {
    try {
      const conferencias = await Conferencia.findAll({
        where: { status: { [Op.in]: ['em_andamento', 'interrompida'] } },
        include: [
          { model: Remessa, as: 'remessas' },
          { model: Pacote, as: 'pacotes' }
        ],
        order: [['id', 'DESC']]
      });
      res.status(200).json(conferencias);
    } catch (error: any) {
      res.status(500).json({ erro: error.message });
    }
  }

  // 5. OBTER DETALHES DE UMA CONFERÊNCIA
  static async obterConferencia(req: Request, res: Response): Promise<void> {
    try {
      const id = Number(req.params.id);
      if (!id || isNaN(id)) {
        res.status(400).json({ erro: 'ID de conferência inválido.' });
        return;
      }

      const conferencia = await Conferencia.findByPk(id, {
        include: [
          { model: Remessa, as: 'remessas' },
          {
            model: Pacote,
            as: 'pacotes',
            include: [
              { model: ItemPacote, as: 'itens' },
              { model: CaixaEmbalagem, as: 'caixa' }
            ]
          }
        ]
      });

      if (!conferencia) {
        res.status(404).json({ erro: 'Conferência não encontrada.' });
        return;
      }

      res.status(200).json(conferencia);
    } catch (error: any) {
      res.status(500).json({ erro: error.message });
    }
  }

  // 6. INTERROMPER E SALVAR
  static async interromper(req: Request, res: Response): Promise<void> {
    try {
      const id = Number(req.params.id);
      if (!id || isNaN(id)) {
        res.status(400).json({ erro: 'ID de conferência inválido.' });
        return;
      }

      const conferencia = await Conferencia.findByPk(id);
      if (!conferencia) {
        res.status(404).json({ erro: 'Conferência não encontrada.' });
        return;
      }

      conferencia.status = 'interrompida';
      await conferencia.save();

      res.status(200).json({ mensagem: 'Conferência interrompida e salva com sucesso!' });
    } catch (error: any) {
      res.status(500).json({ erro: error.message });
    }
  }

  // 7. RETOMAR CONFERÊNCIA
  static async retomar(req: Request, res: Response): Promise<void> {
    try {
      const id = Number(req.params.id);
      if (!id || isNaN(id)) {
        res.status(400).json({ erro: 'ID de conferência inválido.' });
        return;
      }

      const conferencia = await Conferencia.findByPk(id);
      if (!conferencia) {
        res.status(404).json({ erro: 'Conferência não encontrada.' });
        return;
      }

      conferencia.status = 'em_andamento';
      await conferencia.save();

      res.status(200).json({ mensagem: 'Conferência retomada!', conferencia });
    } catch (error: any) {
      res.status(500).json({ erro: error.message });
    }
  }

  // 8. FINALIZAR CONFERÊNCIA
  static async finalizar(req: Request, res: Response): Promise<void> {
    try {
      const id = Number(req.params.id);
      if (!id || isNaN(id)) {
        res.status(400).json({ erro: 'ID de conferência inválido.' });
        return;
      }

      const usuarioLogado = (req as any).usuario;

      const conferencia = await Conferencia.findByPk(id, {
        include: [{ model: Pacote, as: 'pacotes' }]
      });

      if (!conferencia) {
        res.status(404).json({ erro: 'Conferência não encontrada.' });
        return;
      }

      const pacotes = (conferencia as any).pacotes || [];
      const pendentes = pacotes.filter((p: any) => p.status === 'pendente' || p.status === 'divergente_peso');

      if (pendentes.length > 0 && usuarioLogado?.perfil !== 'admin') {
        res.status(403).json({
          erro: `Ainda existem ${pendentes.length} pacote(s) pendentes. Apenas um superior pode encerrar a conferência com pendências.`
        });
        return;
      }

      conferencia.status = 'finalizada';
      conferencia.data_finalizacao = new Date();
      await conferencia.save();

      res.status(200).json({ mensagem: 'Conferência finalizada com sucesso!', conferencia });
    } catch (error: any) {
      res.status(500).json({ erro: error.message });
    }
  }

  // 9. REMOVER ÚLTIMA REMESSA (EXCLUSIVO ADMIN)
  static async removerUltimaRemessa(req: Request, res: Response): Promise<void> {
    const t = await sequelize.transaction();
    try {
      const id = Number(req.params.id);
      if (!id || isNaN(id)) {
        await t.rollback();
        res.status(400).json({ erro: 'ID de conferência inválido.' });
        return;
      }

      const ultimaRemessa = await Remessa.findOne({
        where: { conferencia_id: id },
        order: [['numero_remessa', 'DESC']],
        transaction: t
      });

      if (!ultimaRemessa) {
        await t.rollback();
        res.status(404).json({ erro: 'Nenhuma remessa encontrada nesta conferência para remover.' });
        return;
      }

      // Remove pacotes e itens da remessa
      await Pacote.destroy({ where: { remessa_id: ultimaRemessa.id }, transaction: t });
      await ultimaRemessa.destroy({ transaction: t });

      await t.commit();
      res.status(200).json({ mensagem: `Remessa nº ${ultimaRemessa.numero_remessa} e seus pacotes foram removidos com sucesso.` });
    } catch (error: any) {
      await t.rollback();
      res.status(500).json({ erro: error.message });
    }
  }

  // 10. EXCLUIR PACOTES SELECIONADOS (EXCLUSIVO ADMIN)
  static async excluirPacotes(req: Request, res: Response): Promise<void> {
    try {
      const { ids } = req.body;
      if (!Array.isArray(ids) || ids.length === 0) {
        res.status(400).json({ erro: 'Lista de IDs dos pacotes é obrigatória.' });
        return;
      }

      await Pacote.destroy({ where: { id: { [Op.in]: ids.map(Number) } } });
      res.status(200).json({ mensagem: `${ids.length} pacote(s) excluído(s) com sucesso.` });
    } catch (error: any) {
      res.status(500).json({ erro: error.message });
    }
  }
}