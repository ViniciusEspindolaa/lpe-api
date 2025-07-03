// backend/routes/avaliacoes.ts
import { Router } from "express";
import { z } from "zod";
import { prisma } from "../lib/prisma";

const router = Router();

const avaliacaoSchema = z.object({
  usuarioId: z.string().uuid("ID de usuário deve ser um UUID válido"),
  jogoId: z.number().int("ID de jogo deve ser um número inteiro").positive(),
  comentario: z.string().max(500, "Comentário deve ter até 500 caracteres"),
  nota: z
    .number()
    .int("Nota deve ser um número inteiro")
    .min(0, "Nota deve ser entre 0 e 10")
    .max(10, "Nota deve ser entre 0 e 10"),
  resposta: z
    .string()
    .max(500, "Resposta deve ter até 500 caracteres")
    .optional()
    .default("Nenhuma resposta"),
});

const querySchema = z.object({
  jogoId: z
    .string()
    .optional()
    .transform((val) => (val ? parseInt(val, 10) : undefined))
    .refine((val) => !val || (!isNaN(val) && val > 0), {
      message: "ID de jogo deve ser um número inteiro positivo",
    }),
  usuarioId: z.string().uuid("ID de usuário deve ser um UUID válido").optional(),
});

router.get("/", async (req, res) => {
  try {
    const valida = querySchema.safeParse(req.query);
    if (!valida.success) {
      const erros = valida.error.issues.map((issue) => issue.message).join("; ");
      return res.status(400).json({ erro: erros });
    }

    const { jogoId, usuarioId } = valida.data;

    const avaliacoes = await prisma.avaliacao.findMany({
      where: {
        ...(jogoId ? { jogoId } : {}),
        ...(usuarioId ? { usuarioId } : {}),
      },
      select: {
        id: true,
        usuarioId: true,
        jogoId: true,
        comentario: true,
        nota: true,
        resposta: true,
        createdAt: true,
        updatedAt: true,
        usuario: {
          select: { nome: true },
        },
        jogo: {
          select: { nome: true },
        },
      },
    });

    res.status(200).json(avaliacoes);
  } catch (error: unknown) {
    console.error("Erro ao buscar avaliações:", error);
    const errorMessage = error instanceof Error ? error.message : "Erro desconhecido";
    res.status(500).json({ erro: errorMessage });
  }
});

router.post("/", async (req, res) => {
  try {
    console.log("Corpo da requisição:", req.body);

    const valida = avaliacaoSchema.safeParse(req.body);
    if (!valida.success) {
      const erros = valida.error.issues.map((issue) => issue.message).join("; ");
      console.log("Erro de validação:", erros);
      return res.status(400).json({ erro: erros });
    }

    const { usuarioId, jogoId, comentario, nota, resposta } = valida.data;

    const usuarioExistente = await prisma.usuario.findUnique({
      where: { id: usuarioId },
    });
    if (!usuarioExistente) {
      return res.status(404).json({ erro: "Usuário não encontrado" });
    }

    const jogoExistente = await prisma.jogo.findUnique({
      where: { id: jogoId },
    });
    if (!jogoExistente) {
      return res.status(404).json({ erro: "Jogo não encontrado" });
    }

    const avaliacao = await prisma.avaliacao.create({
      data: {
        usuarioId,
        jogoId,
        comentario,
        nota,
        resposta,
      },
    });

    res.status(201).json(avaliacao);
  } catch (error: unknown) {
    console.error("Erro ao criar avaliação:", error);
    const errorMessage = error instanceof Error ? error.message : "Erro desconhecido";
    res.status(500).json({ erro: errorMessage });
  }
});

export default router;