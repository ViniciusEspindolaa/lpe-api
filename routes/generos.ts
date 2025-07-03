import { PrismaClient } from '@prisma/client';
import { Router } from 'express';
import { z } from 'zod';
import verificaToken from '../middlewares/auth'; // 1. Importe o middleware

const prisma = new PrismaClient();
const router = Router();

// 2. Aplique o middleware a todas as rotas deste ficheiro
// Qualquer pedido a /generos passará primeiro pela verificação do token
router.use(verificaToken);

const generoSchema = z.object({
  nome: z.string().min(3, {
    message: "O nome do género deve possuir, no mínimo, 3 caracteres"
  })
});

router.get("/", async (req, res) => {
  try {
    const generos = await prisma.genero.findMany();
    res.status(200).json(generos);
  } catch (error) {
    res.status(500).json({ erro: error });
  }
});

router.post("/", async (req, res) => {
  const valida = generoSchema.safeParse(req.body);
  if (!valida.success) {
    return res.status(400).json({ erro: valida.error });
  }

  const { nome } = valida.data;

  try {
    const genero = await prisma.genero.create({
      data: { nome }
    });
    res.status(201).json(genero);
  } catch (error) {
    res.status(400).json({ erro: error });
  }
});

router.delete("/:id", async (req, res) => {
  const { id } = req.params;

  try {
    const genero = await prisma.genero.delete({
      where: { id: Number(id) }
    });
    res.status(200).json(genero);
  } catch (error) {
    res.status(400).json({ erro: error });
  }
});

router.put("/:id", async (req, res) => {
  const { id } = req.params;

  const valida = generoSchema.safeParse(req.body);
  if (!valida.success) {
    return res.status(400).json({ erro: valida.error });
  }

  const { nome } = valida.data;

  try {
    const genero = await prisma.genero.update({
      where: { id: Number(id) },
      data: { nome }
    });
    res.status(200).json(genero);
  } catch (error) {
    res.status(400).json({ erro: error });
  }
});

export default router;
