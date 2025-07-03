import { PrismaClient } from '@prisma/client'
import { Router } from 'express'
import { z } from 'zod'

const prisma = new PrismaClient()
// const prisma = new PrismaClient({
//   log: [
//     {
//       emit: 'event',
//       level: 'query',
//     },
//     {
//       emit: 'stdout',
//       level: 'error',
//     },
//     {
//       emit: 'stdout',
//       level: 'info',
//     },
//     {
//       emit: 'stdout',
//       level: 'warn',
//     },
//   ],
// })

// prisma.$on('query', (e) => {
//   console.log('Query: ' + e.query)
//   console.log('Params: ' + e.params)
//   console.log('Duration: ' + e.duration + 'ms')
// })

const router = Router()

const jogoSchema = z.object({
  nome: z.string().min(2,
    { message: "Nome deve possuir, no mínimo, 2 caracteres" }),
  ano: z.number(),
  desenvolvedora: z.string().min(2,
    { message: "Desenvolvedora deve possuir, no mínimo, 2 caracteres" }),
  publicadora: z.string().min(2,
    { message: "Publicadora deve possuir, no mínimo, 2 caracteres" }),
  plataforma: z.string().min(2,
    { message: "Plataforma deve possuir, no mínimo, 2 caracteres" }),
  foto: z.string(),
  descricao: z.string().min(10,
    { message: "Descrição deve possuir, no mínimo, 10 caracteres" }),
  destaque: z.boolean().optional(),
  generoId: z.number(),
})

router.get("/", async (req, res) => {
  try {
    const jogos = await prisma.jogo.findMany({
      include: {
        genero: true,
      }
    })
    res.status(200).json(jogos)
  } catch (error) {
    res.status(500).json({ erro: error })
  }
})

router.post("/", async (req, res) => {

  const valida = jogoSchema.safeParse(req.body)
  if (!valida.success) {
    res.status(400).json({ erro: valida.error })
    return
  }

  const { nome, ano, desenvolvedora, publicadora, plataforma, foto, descricao,
    destaque = true, generoId } = valida.data

  try {
    const jogo = await prisma.jogo.create({
      data: {
        nome, ano, desenvolvedora, publicadora, plataforma, foto, descricao, destaque,
        generoId
      }
    })
    res.status(201).json(jogo)
  } catch (error) {
    res.status(400).json({ error })
  }
})

router.delete("/:id", async (req, res) => {
  const { id } = req.params

  try {
    const jogo = await prisma.jogo.delete({
      where: { id: Number(id) }
    })
    res.status(200).json(jogo)
  } catch (error) {
    res.status(400).json({ erro: error })
  }
})

router.put("/:id", async (req, res) => {
  const { id } = req.params

  const valida = jogoSchema.safeParse(req.body)
  if (!valida.success) {
    res.status(400).json({ erro: valida.error })
    return
  }

  const { nome, ano, desenvolvedora, publicadora, plataforma, foto, descricao,
    destaque, generoId } = valida.data

  try {
    const jogo = await prisma.jogo.update({
      where: { id: Number(id) },
      data: {
        nome, ano, desenvolvedora, publicadora, plataforma, foto, descricao,
        destaque, generoId
      }
    })
    res.status(200).json(jogo)
  } catch (error) {
    res.status(400).json({ error })
  }
})

router.get("/pesquisa/:termo", async (req, res) => {
  const { termo } = req.params

  // tenta converter para número
  const termoNumero = Number(termo)

  // is Not a Number, ou seja, se não é um número: filtra por texto
  if (isNaN(termoNumero)) {
    try {
      const jogos = await prisma.jogo.findMany({
        include: {
          genero: true,
        },
        where: {
          OR: [
            // mode insensitive é para não diferenciar maiusculas de minusculas
            // necessario no PostGreSQL (no MySQL é o padrão)
            { nome: { contains: termo, mode: "insensitive" } },
            { genero: { nome: { equals: termo, mode: "insensitive" } } },
            { desenvolvedora: { contains: termo, mode: "insensitive" } },
            { publicadora: { contains: termo, mode: "insensitive" } },
            { plataforma: { contains: termo, mode: "insensitive" } },
          ]
        }
      })
      res.status(200).json(jogos)
    } catch (error) {
      res.status(500).json({ erro: error })
    }
  } else {
    if (termoNumero <= 3000) {
      try {
        const jogos = await prisma.jogo.findMany({
          include: {
            genero: true,
          },
          where: { ano: termoNumero }
        })
        res.status(200).json(jogos)
      } catch (error) {
        res.status(500).json({ erro: error })
      }
    } else {
      try {
        const jogos = await prisma.jogo.findMany({
          include: {
            genero: true,
          }
        })
        res.status(200).json(jogos)
      } catch (error) {
        res.status(500).json({ erro: error })
      }
    }
  }
})

router.get("/:id", async (req, res) => {
  const { id } = req.params

  try {
    const jogo = await prisma.jogo.findUnique({
      where: { id: Number(id) },
      include: {
        genero: true
      }
    })
    res.status(200).json(jogo)
  } catch (error) {
    res.status(400).json(error)
  }
})

export default router
