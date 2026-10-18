import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';

// 1. Injetamos a propriedade 'usuario' diretamente na tipagem global do Express.
// Assim, o TypeScript nunca mais vai reclamar do "req.usuario" em nenhum ficheiro!
declare global {
  namespace Express {
    interface Request {
      usuario?: {
        id: number;
        nome: string;
        perfil: 'admin' | 'conferente';
      };
    }
  }
}

// 2. O Segurança Principal: Verifica se o Token existe e é válido
export const verificarToken = (req: Request, res: Response, next: NextFunction): void => {
  const authHeader = req.headers.authorization;

  if (!authHeader) {
    res.status(401).json({ erro: 'Acesso negado. Token não fornecido.' });
    return;
  }

  const token = authHeader.split(' ')[1];

  if (!token) {
    res.status(401).json({ erro: 'Acesso negado. Token mal formatado.' });
    return;
  }

  try {
    const secret = process.env.JWT_SECRET || 'chave_secreta_padrao';
    // Fazemos o cast (as any) para garantir que o JWT devolve o objeto esperado
    const payload = jwt.verify(token, secret) as any;
    
    // Agora o TypeScript aceita perfeitamente!
    req.usuario = {
      id: payload.id,
      nome: payload.nome,
      perfil: payload.perfil
    };
    
    next(); 
  } catch (error) {
    res.status(403).json({ erro: 'Token inválido ou expirado. Faça login novamente.' });
  }
};

// 3. O Segurança VIP: Verifica se quem está tentando acessar é Administrador
export const apenasAdmin = (req: Request, res: Response, next: NextFunction): void => {
  if (!req.usuario || req.usuario.perfil !== 'admin') {
    res.status(403).json({ erro: 'Acesso restrito. Requer privilégios de Administrador.' });
    return;
  }
  
  next(); 
};