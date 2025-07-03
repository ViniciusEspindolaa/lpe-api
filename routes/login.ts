// backend/routes/login.ts
import { Router } from "express";
import { z } from "zod";
import { prisma } from "../lib/prisma";
import bcrypt from "bcrypt";

const router = Router();

const loginSchema = z.object({
  email: z.string().email("Email inválido"),
  senha: z.string().min(6, "Senha deve ter pelo menos 6 caracteres"),
});

router.post("/", async (req, res) => {
  try {
    const valida = loginSchema.safeParse(req.body);
    if (!valida.success) {
      const erros = valida.error.issues.map((issue) => issue.message).join("; ");
      return res.status(400).json({ erro: erros });
    }

    const { email, senha } = valida.data;

    const usuario = await prisma.usuario.findUnique({
      where: { email },
      select: { id: true, nome: true, email: true, senha: true },
    });

    if (!usuario) {
      return res.status(401).json({ erro: "Email ou senha inválidos" });
    }

    const senhaValida = await bcrypt.compare(senha, usuario.senha);
    if (!senhaValida) {
      return res.status(401).json({ erro: "Email ou senha inválidos" });
    }

    const { senha: _, ...usuarioSemSenha } = usuario;
    res.status(200).json(usuarioSemSenha);
  } catch (error) {
    console.error("Erro no login:", error);
    res.status(500).json({ erro: "Erro interno do servidor" });
  }
});

export default router;