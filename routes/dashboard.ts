import { PrismaClient } from "@prisma/client"
import { Router } from "express"

const prisma = new PrismaClient()
const router = Router()

router.get("/gerais", async (req, res) => {
  try {
    const usuarios = await prisma.usuario.count()
    const jogos = await prisma.jogo.count()
    const avaliacoes = await prisma.avaliacao.count()
    res.status(200).json({ usuarios, jogos, avaliacoes })
  } catch (error) {
    res.status(400).json(error)
  }
})

router.get("/jogosGenero", async (req, res) => {
  try {
    const generos = await prisma.genero.findMany({
      select: {
        nome: true,
        _count: {
          select: { jogos: true }
        }
      }
    })

    const generos2 = generos
        .filter(item => item._count.jogos > 0)
        .map(item => ({
            genero: item.nome,
            num: item._count.jogos
        }))
    res.status(200).json(generos2)
  } catch (error) {
    res.status(400).json(error)
  }
})

// router.get("/clientesCidade", async (req, res) => {
//   try {
//     const clientes = await prisma.cliente.groupBy({
//       by: ['cidade'],
//       _count: {
//         cidade: true,
//       },
//     })

//     const clientes2 = clientes.map(cliente => ({
//       cidade: cliente.cidade,
//       num: cliente._count.cidade
//     }))

//     res.status(200).json(clientes2)
//   } catch (error) {
//     res.status(400).json(error)
//   }
// })

export default router
