import { Request, Response } from 'express';
import { Op } from 'sequelize';
import bcrypt from 'bcrypt';
import PDFDocument from 'pdfkit';
import sequelize from '../config/database';
import Conferencia from '../models/Conferencia';
import Remessa from '../models/Remessa';
import Pacote from '../models/Pacote';
import ItemPacote from '../models/ItemPacote';
import CaixaEmbalagem from '../models/CaixaEmbalagem';
import SkuProduto from '../models/SkuProduto';
import RegraIcms from '../models/RegraIcms';
import Usuario from '../models/Usuario';

export class ConferenciaController {
  static async importarRemessa(req: Request, res: Response): Promise<void> {
    const t = await sequelize.transaction();
    try {
      const { arquivo_nome, pacotes, conferencia_ativa_id } = req.body;
      const usuarioLogado = (req as any).usuario || (req as any).user;

      if (!usuarioLogado) {
        await t.rollback();
        res.status(401).json({ erro: 'Utilizador não autenticado.' });
        return;
      }

      if (!arquivo_nome || !Array.isArray(pacotes) || pacotes.length === 0) {
        await t.rollback();
        res.status(400).json({ erro: 'Ficheiro JSON inválido ou lista de pacotes vazia.' });
        return;
      }

      const transportadorasArquivo = [...new Set(pacotes.map((p: any) => p.transportadora).filter(Boolean))];
      if (transportadorasArquivo.length === 0) {
        await t.rollback();
        res.status(400).json({ erro: 'Nenhuma transportadora identificada no ficheiro JSON importado.' });
        return;
      }
      if (transportadorasArquivo.length > 1) {
        await t.rollback();
        res.status(400).json({
          erro: `Ficheiro inválido: contém múltiplas transportadoras (${transportadorasArquivo.join(', ')}). Cada remessa deve conter apenas uma transportadora.`
        });
        return;
      }

      const transportadoraArquivo = transportadorasArquivo[0] as string;

      if (conferencia_ativa_id) {
        const confAtual = await Conferencia.findByPk(Number(conferencia_ativa_id), { transaction: t });
        if (confAtual && confAtual.status === 'em_andamento' && confAtual.transportadora !== transportadoraArquivo) {
          await t.rollback();
          res.status(400).json({
            erro: `A conferência ativa pertence à "${confAtual.transportadora}". O ficheiro importado pertence à "${transportadoraArquivo}". Interrompa ou finalize a conferência atual antes de importar pacotes de outra transportadora.`
          });
          return;
        }
      }

      let conferencia = await Conferencia.findOne({
        where: {
          transportadora: transportadoraArquivo,
          status: { [Op.in]: ['em_andamento', 'interrompida'] }
        },
        transaction: t
      });

      if (!conferencia) {
        conferencia = await Conferencia.create({
          transportadora: transportadoraArquivo,
          status: 'em_andamento',
          usuario_id: usuarioLogado.id,
          data_inicio: new Date()
        }, { transaction: t });
      } else if (conferencia.status === 'interrompida') {
        conferencia.status = 'em_andamento';
        await conferencia.save({ transaction: t });
      }

      const remessaExistente = await Remessa.findOne({
        where: {
          conferencia_id: conferencia.id,
          arquivo_nome
        },
        transaction: t
      });

      if (remessaExistente) {
        await t.rollback();
        res.status(409).json({
          erro: `O ficheiro "${arquivo_nome}" já foi importado anteriormente na Remessa nº ${remessaExistente.numero_remessa} desta conferência.`
        });
        return;
      }

      const numerosNfJson = pacotes.map((p: any) => String(p.numero_nf));
      const chavesAcessoJson = pacotes.map((p: any) => String(p.chave_acesso));

      const pacotesExistentesNoBanco = await Pacote.findAll({
        where: {
          [Op.or]: [
            { numero_nf: { [Op.in]: numerosNfJson } },
            { chave_acesso: { [Op.in]: chavesAcessoJson } }
          ]
        },
        transaction: t
      });

      const nfsExistentesSet = new Set(pacotesExistentesNoBanco.map(p => p.numero_nf));
      const chavesExistentesSet = new Set(pacotesExistentesNoBanco.map(p => p.chave_acesso));

      const todasRepetidas = pacotes.every((p: any) =>
        chavesExistentesSet.has(String(p.chave_acesso)) || nfsExistentesSet.has(String(p.numero_nf))
      );

      if (todasRepetidas) {
        await t.rollback();
        res.status(400).json({
          erro: 'Todas as notas fiscais deste ficheiro já foram importadas e conferidas no sistema.'
        });
        return;
      }

      const totalRemessas = await Remessa.count({
        where: { conferencia_id: conferencia.id },
        transaction: t
      });
      const proximoNumeroRemessa = totalRemessas + 1;

      const novaRemessa = await Remessa.create({
        conferencia_id: conferencia.id,
        numero_remessa: proximoNumeroRemessa,
        arquivo_nome,
        total_pacotes: pacotes.length,
        data_importacao: new Date()
      }, { transaction: t });

      const regrasIcms = await RegraIcms.findAll({ transaction: t });
      const ufsComGuia = new Set(regrasIcms.filter(r => r.exige_guia).map(r => r.uf.toUpperCase()));

      let adicionados = 0;
      let duplicadosIgnorados = 0;

      for (const p of pacotes) {
        const nfStr = String(p.numero_nf);
        const chaveStr = String(p.chave_acesso);

        if (nfsExistentesSet.has(nfStr) || chavesExistentesSet.has(chaveStr)) {
          duplicadosIgnorados++;
          continue;
        }

        const pacoteCriado = await Pacote.create({
          conferencia_id: conferencia.id,
          remessa_id: novaRemessa.id,
          chave_acesso: chaveStr,
          numero_nf: nfStr,
          razao_social: p.razao_social || 'Consumidor Final',
          descricao_produto: p.itens?.[0]?.descricao_produto || '',
          uf: (p.uf || 'SP').toUpperCase(),
          status: 'pendente',
          possui_guia_icms: ufsComGuia.has((p.uf || '').toUpperCase()),
          tentativas_peso: 0
        }, { transaction: t });

        nfsExistentesSet.add(nfStr);
        chavesExistentesSet.add(chaveStr);
        adicionados++;

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

      let mensagemSucesso = `Remessa #${proximoNumeroRemessa} importada com sucesso (${adicionados} novos pacotes adicionados).`;
      if (duplicadosIgnorados > 0) {
        mensagemSucesso += ` ${duplicadosIgnorados} pacote(s) repetido(s) ignorado(s).`;
      }

      res.status(201).json({
        mensagem: mensagemSucesso,
        conferencia_id: conferencia.id,
        remessa_id: novaRemessa.id,
        transportadora: transportadoraArquivo,
        pacotes_adicionados: adicionados,
        pacotes_duplicados: duplicadosIgnorados
      });
    } catch (error: any) {
      await t.rollback();
      res.status(500).json({ erro: error.message });
    }
  }

  static async conferirPacote(req: Request, res: Response): Promise<void> {
    try {
      const { conferencia_id, codigo_caixa, codigo_pacote, peso_balanca } = req.body;

      if (!conferencia_id || !codigo_caixa || !codigo_pacote) {
        res.status(400).json({ erro: 'ID da conferência, código da caixa e código do pacote são obrigatórios.' });
        return;
      }

      if (peso_balanca === undefined || peso_balanca === null) {
        res.status(400).json({ erro: 'Peso da balança é obrigatório.' });
        return;
      }

      const caixa = await CaixaEmbalagem.findOne({
        where: { codigo_sku: String(codigo_caixa).trim().toUpperCase() }
      });
      if (!caixa) {
        res.status(404).json({ erro: `Caixa com SKU/código "${codigo_caixa}" não cadastrada no sistema.` });
        return;
      }

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
          erro: 'DIVERGÊNCIA: Pacote não pertence a esta conferência/remessa.'
        });
        return;
      }

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

      if (pacote.status === 'bloqueado') {
        res.status(403).json({
          status: 'bloqueado',
          erro: 'Pacote travado por divergência de peso na 2ª tentativa. Requer autorização de um superior.'
        });
        return;
      }

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
      const pesoLido = Number(peso_balanca);

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

  static async liberarDivergente(req: Request, res: Response): Promise<void> {
    try {
      const { pacote_id, email_superior, senha_superior, justificativa } = req.body;

      if (!pacote_id || !email_superior || !senha_superior || !justificativa) {
        res.status(400).json({ erro: 'ID do pacote, credenciais do superior e justificativa são obrigatórios.' });
        return;
      }

      const superior = await Usuario.findOne({ where: { email: email_superior } });
      if (!superior || superior.perfil !== 'admin') {
        res.status(403).json({ erro: 'Credenciais inválidas ou utilizador não possui privilégios de superior.' });
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

  static async listarConferenciasFinalizadas(req: Request, res: Response): Promise<void> {
    try {
      const conferencias = await Conferencia.findAll({
        where: { status: 'finalizada' },
        include: [
          { model: Pacote, as: 'pacotes' },
          { model: Usuario, as: 'usuario' }
        ],
        order: [['data_finalizacao', 'DESC']]
      });
      res.status(200).json(conferencias);
    } catch (error: any) {
      res.status(500).json({ erro: error.message });
    }
  }

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

  static async finalizar(req: Request, res: Response): Promise<void> {
    try {
      const id = Number(req.params.id);
      if (!id || isNaN(id)) {
        res.status(400).json({ erro: 'ID de conferência inválido.' });
        return;
      }

      const usuarioLogado = (req as any).usuario || (req as any).user;
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

      await Pacote.destroy({ where: { remessa_id: ultimaRemessa.id }, transaction: t });
      await ultimaRemessa.destroy({ transaction: t });

      await t.commit();
      res.status(200).json({ mensagem: `Remessa nº ${ultimaRemessa.numero_remessa} e os respetivos pacotes foram removidos com sucesso.` });
    } catch (error: any) {
      await t.rollback();
      res.status(500).json({ erro: error.message });
    }
  }

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

  static async gerarMinuta(req: Request, res: Response): Promise<void> {
    try {
      const id = Number(req.params.id);

      const conferencia = await Conferencia.findByPk(id, {
        include: [
          { model: Usuario, as: 'usuario' },
          {
            model: Pacote,
            as: 'pacotes',
            where: { status: { [Op.in]: ['ok', 'liberado_divergente'] } },
            required: false,
            include: [{ model: ItemPacote, as: 'itens' }]
          }
        ]
      });

      if (!conferencia) {
        res.status(404).json({ erro: 'Conferência não encontrada.' });
        return;
      }

      const pacotes = (conferencia as any).pacotes || [];
      const conferenteNome = (conferencia as any).usuario?.nome || 'Operador Padrão';
      const dataDoc = conferencia.data_finalizacao ? new Date(conferencia.data_finalizacao).toLocaleDateString('pt-BR') : new Date().toLocaleDateString('pt-BR');

      const totalVolumes = pacotes.length;
      const totalPesoGramas = pacotes.reduce((acc: number, p: any) => acc + Number(p.peso_lido_g || 0), 0);
      const totalPesoKg = (totalPesoGramas / 1000).toFixed(2);

      const doc = new PDFDocument({ margin: 40, size: 'A4' });

      res.setHeader('Content-Type', 'application/pdf');
      res.setHeader('Content-Disposition', `inline; filename="Minuta_${conferencia.transportadora}_${id}.pdf"`);
      doc.pipe(res);

      // Cabeçalho
      doc.fontSize(16).font('Helvetica-Bold').text('EUROART - MINUTA DE TRANSPORTE', { align: 'center' });
      doc.moveDown(1);
      
      doc.fontSize(10).font('Helvetica');
      doc.text(`ID Conferência: #${conferencia.id}`);
      doc.text(`Transportadora: ${conferencia.transportadora.toUpperCase()}`);
      doc.text(`Data de Fecho: ${dataDoc}`);
      doc.text(`Conferente Responsável: ${conferenteNome}`);
      doc.moveDown(2);

      let y = doc.y;
      
      // Cabeçalho da Tabela
      doc.font('Helvetica-Bold').fontSize(9);
      doc.text('NF', 40, y);
      doc.text('CLIENTE', 95, y);
      doc.text('PRODUTOS (QTD)', 210, y);
      doc.text('STATUS', 330, y);
      doc.text('PESO (g)', 410, y);
      doc.text('DATA/HORA', 470, y);
      
      doc.moveTo(40, y + 12).lineTo(550, y + 12).stroke();
      y += 20;

      doc.font('Helvetica').fontSize(9);
      for (const p of pacotes) {
        const itensLista = p.itens || [];
        
        // Calcula a altura dinâmica da linha com base na quantidade de SKUs
        // Cada SKU ocupa 12px de altura. Adicionamos 8px de respiro (padding) no final.
        const alturaLinha = Math.max(1, itensLista.length) * 12 + 8;

        // Se a linha for ultrapassar o limite da página, cria uma nova
        if (y + alturaLinha > 750) { doc.addPage(); y = 40; }

        const dataConf = p.data_conferido ? new Date(p.data_conferido).toLocaleString('pt-BR', { dateStyle: 'short', timeStyle: 'short' }) : '-';
        const statusTexto = p.status === 'ok' ? 'OK' : 'LIB. DIVERG.';
        const clienteResumo = p.razao_social.length > 20 ? p.razao_social.substring(0, 18) + '...' : p.razao_social;

        // Imprime os dados principais na linha inicial
        doc.text(p.numero_nf, 40, y);
        doc.text(clienteResumo, 95, y);
        doc.text(statusTexto, 330, y);
        doc.text(p.peso_lido_g.toString(), 410, y);
        doc.text(dataConf, 470, y);
        
        // Laço para imprimir os SKUs um embaixo do outro na coluna central
        let currentY = y;
        if (itensLista.length === 0) {
          doc.text('-', 210, currentY);
        } else {
          for (const item of itensLista) {
            // Exemplo de saída: 12120ID (2x)
            doc.text(`${item.codigo_sku} (${item.quantidade}x)`, 210, currentY);
            currentY += 12; // Desce 12 pixels para a linha do próximo produto
          }
        }
        
        // Atualiza a posição Y para a próxima nota fiscal
        y += alturaLinha;
      }

      // Rodapé com Totais
      doc.moveDown(2);
      y = doc.y;
      if (y > 650) { doc.addPage(); y = 40; }

      doc.font('Helvetica-Bold').fontSize(11);
      doc.text(`RESUMO DA CARGA`, 40, y);
      doc.font('Helvetica').fontSize(10);
      doc.text(`Volumes Totais: ${totalVolumes} caixas`, 40, y + 15);
      doc.text(`Peso Total da Carga: ${totalPesoKg} Kg`, 40, y + 30);

      // Assinaturas
      doc.moveTo(80, y + 100).lineTo(250, y + 100).stroke();
      doc.text('Assinatura do Motorista', 105, y + 105);

      doc.moveTo(330, y + 100).lineTo(500, y + 100).stroke();
      doc.text('Assinatura do Conferente', 355, y + 105);

      doc.end();
    } catch (error: any) {
      res.status(500).json({ erro: error.message });
    }
  }
}

export default ConferenciaController;