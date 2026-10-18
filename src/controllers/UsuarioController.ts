import { Request, Response } from 'express';
import Usuario from '../models/Usuario';
import bcrypt from 'bcrypt';

export class UsuarioController {
  // Criar novo usuário (Apenas Admin)
  static async criar(req: Request, res: Response): Promise<void> {
    try {
      const { nome, email, senha, perfil } = req.body;

      if (!nome || !email || !senha) {
        res.status(400).json({ erro: 'Nome, e-mail e senha são obrigatórios.' });
        return;
      }

      const usuarioExistente = await Usuario.findOne({ where: { email } });
      if (usuarioExistente) {
        res.status(400).json({ erro: 'Este e-mail já está em uso.' });
        return;
      }

      const senha_hash = await bcrypt.hash(senha, 10);
      
      const novoUsuario = await Usuario.create({
        nome,
        email,
        senha_hash,
        perfil: perfil || 'conferente'
      });

      res.status(201).json({
        mensagem: 'Usuário criado com sucesso!',
        usuario: { id: novoUsuario.id, nome: novoUsuario.nome, email: novoUsuario.email, perfil: novoUsuario.perfil }
      });
    } catch (error: any) {
      res.status(400).json({ erro: error.message });
    }
  }

  // Listar todos os usuários (Apenas Admin)
  static async listar(req: Request, res: Response): Promise<void> {
    try {
      const usuarios = await Usuario.findAll({
        attributes: ['id', 'nome', 'email', 'perfil', 'criado_em'],
        order: [['id', 'ASC']]
      });
      res.status(200).json(usuarios);
    } catch (error: any) {
      res.status(500).json({ erro: error.message });
    }
  }

  // Editar usuário existente (Apenas Admin)
  static async atualizar(req: Request, res: Response): Promise<void> {
    try {
      const usuarioId = Number(req.params.id);

      if (isNaN(usuarioId)) {
        res.status(400).json({ erro: 'ID do usuário inválido.' });
        return;
      }

      const { nome, email, perfil, novaSenha } = req.body;

      const usuario = await Usuario.findByPk(usuarioId);
      if (!usuario) {
        res.status(404).json({ erro: 'Usuário não encontrado.' });
        return;
      }

      if (nome) usuario.nome = nome;
      if (email) usuario.email = email;
      if (perfil) usuario.perfil = perfil;

      if (novaSenha && novaSenha.trim() !== '') {
        usuario.senha_hash = await bcrypt.hash(novaSenha, 10);
      }

      await usuario.save();

      res.status(200).json({
        mensagem: 'Usuário atualizado com sucesso!',
        usuario: { id: usuario.id, nome: usuario.nome, email: usuario.email, perfil: usuario.perfil }
      });
    } catch (error: any) {
      res.status(400).json({ erro: error.message });
    }
  }

  // Excluir usuário (Apenas Admin)
  static async excluir(req: Request, res: Response): Promise<void> {
    try {
      const usuarioId = Number(req.params.id);

      if (isNaN(usuarioId)) {
        res.status(400).json({ erro: 'ID do usuário inválido.' });
        return;
      }

      const usuario = await Usuario.findByPk(usuarioId);

      if (!usuario) {
        res.status(404).json({ erro: 'Usuário não encontrado.' });
        return;
      }

      // Evita que o admin exclua a si próprio
      if (req.usuario && req.usuario.id === usuarioId) {
        res.status(400).json({ erro: 'Você não pode excluir o seu próprio usuário logado.' });
        return;
      }

      await usuario.destroy();
      res.status(200).json({ mensagem: 'Usuário excluído com sucesso!' });
    } catch (error: any) {
      res.status(500).json({ erro: error.message });
    }
  }
}