import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import Usuario from '../models/Usuario';

export class AuthService {
  // Verifica se o sistema já tem usuários cadastrados
  static async checkSetup() {
    const totalUsuarios = await Usuario.count();
    return { hasUsers: totalUsuarios > 0 };
  }

  // Registra um novo usuário
  static async registrar(nome: string, email: string, senha: string, perfilDesejado?: 'admin' | 'conferente') {
    const usuarioExistente = await Usuario.findOne({ where: { email } });
    if (usuarioExistente) {
      throw new Error('E-mail já está em uso.');
    }

    const totalUsuarios = await Usuario.count();
    let perfilFinal: 'admin' | 'conferente' = 'conferente';

    if (totalUsuarios === 0) {
      perfilFinal = 'admin';
    } else if (perfilDesejado) {
      perfilFinal = perfilDesejado;
    }

    const senha_hash = await bcrypt.hash(senha, 10);

    const novoUsuario = await Usuario.create({
      nome,
      email,
      senha_hash,
      perfil: perfilFinal,
    });

    return {
      id: novoUsuario.id,
      nome: novoUsuario.nome,
      email: novoUsuario.email,
      perfil: novoUsuario.perfil,
    };
  }

  // Realiza o login
  static async login(email: string, senha: string) {
    const usuario = await Usuario.findOne({ where: { email } });
    if (!usuario) {
      throw new Error('E-mail ou senha inválidos.');
    }

    const senhaValida = await bcrypt.compare(senha, usuario.senha_hash);
    if (!senhaValida) {
      throw new Error('E-mail ou senha inválidos.');
    }

    const secret = process.env.JWT_SECRET || 'chave_secreta_padrao';
    
    const token = jwt.sign(
      { id: usuario.id, nome: usuario.nome, perfil: usuario.perfil },
      secret,
      { expiresIn: '8h' }
    );

    return {
      usuario: {
        id: usuario.id,
        nome: usuario.nome,
        email: usuario.email,
        perfil: usuario.perfil,
      },
      token,
    };
  }
}