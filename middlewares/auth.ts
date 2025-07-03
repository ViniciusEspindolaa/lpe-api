import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';

// Interface para estender o objeto Request e adicionar a propriedade adminId
interface AuthRequest extends Request {
  adminId?: number;
}

// Alterado para exportação padrão (default export)
export default function verificaToken(req: AuthRequest, res: Response, next: NextFunction) {
  const { authorization } = req.headers;

  // Verifica se o cabeçalho de autorização foi enviado
  if (!authorization) {
    return res.status(401).json({ erro: 'Token não fornecido' });
  }

  // Separa o "Bearer" do token
  const [type, token] = authorization.split(' ');

  if (type !== 'Bearer' || !token) {
    return res.status(401).json({ erro: 'Formato de token inválido' });
  }

  try {
    // Verifica se o token é válido usando a sua chave secreta
    // Certifique-se de que tem a variável JWT_SECRET no seu ficheiro .env.local
    const decoded = jwt.verify(token, process.env.JWT_SECRET as string) as { id: number };

    // Adiciona o ID do admin ao objeto de requisição para uso futuro, se necessário
    req.adminId = decoded.id;

    // Se o token for válido, permite que a requisição continue para a rota
    return next();
  } catch (error) {
    return res.status(401).json({ erro: 'Token inválido ou expirado' });
  }
}
