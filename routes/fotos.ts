import { PrismaClient } from '@prisma/client'
import { Router } from 'express'
import { z } from 'zod'
import multer from 'multer'
import { CloudinaryStorage } from 'multer-storage-cloudinary'
import { v2 as cloudinary } from 'cloudinary'

const prisma = new PrismaClient()
const router = Router()

const fotoSchema = z.object({
  descricao: z.string().min(5,
    { message: "Descrição deve possuir, no mínimo, 5 caracteres" }),
  jogoId: z.coerce.number(),
})

router.get("/", async (req, res) => {
  try {
    const fotos = await prisma.foto.findMany({
      include: {
        jogos: true,
      }
    })
    res.status(200).json(fotos)
  } catch (error) {
    res.status(500).json({ erro: error })
  }
})

// Configuration
cloudinary.config({
  cloud_name: 'dn4zch2p8',
  api_key: '358837862491599',
  api_secret: 'zV1vCXF_Ln1C9lHRkzbreH5KH6U' // Click 'View API Keys' above to copy your API secret
});

const storage = new CloudinaryStorage({
  cloudinary,
  params: async (requestAnimationFrame, file) => {
    return {
      folder: 'revenda_fotos',
      allowed_formats: ['jpg', 'png', 'jpeg'],
      public_id: `${Date.now()}-${file.originalname.split(".")[0]}`
    }
  },
});

const upload = multer({ storage })

router.post("/", upload.single('imagem'), async (req, res) => {

  const valida = fotoSchema.safeParse(req.body)
  if (!valida.success) {
    res.status(400).json({ erro: valida.error })
    return
  }

  if (!req.file || !req.file.path) {
    res.status(400).json({ erro: "Imagem não enviada" })
  }

  const { descricao, jogoId } = valida.data
  const urlFoto = req.file?.path || '';
  if (!urlFoto) {
    res.status(400).json({ erro: "Imagem não enviada" });
    return;
  }

  try {
    const foto = await prisma.foto.create({
      data: {
        descricao, jogoId, url: urlFoto
      }
    })
    res.status(201).json(foto)
  } catch (error) {
    res.status(400).json({ error })
  }
})

// router.delete("/:id", async (req, res) => {
//   const { id } = req.params

//   try {
//     const carro = await prisma.carro.delete({
//       where: { id: Number(id) }
//     })
//     res.status(200).json(carro)
//   } catch (error) {
//     res.status(400).json({ erro: error })
//   }
// })

// router.put("/:id", async (req, res) => {
//   const { id } = req.params

//   const valida = fotoSchema.safeParse(req.body)
//   if (!valida.success) {
//     res.status(400).json({ erro: valida.error })
//     return
//   }

//   const { modelo, ano, preco, km, foto, acessorios,
//     destaque, combustivel, marcaId } = valida.data

//   try {
//     const carro = await prisma.carro.update({
//       where: { id: Number(id) },
//       data: {
//         modelo, ano, preco, km, foto, acessorios,
//         destaque, combustivel, marcaId
//       }
//     })
//     res.status(200).json(carro)
//   } catch (error) {
//     res.status(400).json({ error })
//   }
// })

// router.get("/pesquisa/:termo", async (req, res) => {
//   const { termo } = req.params

//   // tenta converter para número
//   const termoNumero = Number(termo)

//   // is Not a Number, ou seja, se não é um número: filtra por texto
//   if (isNaN(termoNumero)) {
//     try {
//       const jogos = await prisma.carro.findMany({
//         include: {
//           marca: true,
//         },
//         where: {
//           OR: [
//             // mode insensitive é para não diferenciar maiusculas de minusculas
//             // necessario no PostGreSQL (no MySQL é o padrão)
//             { modelo: { contains: termo, mode: "insensitive" } },
//             { marca: { nome: { equals: termo, mode: "insensitive" } } }
//           ]
//         }
//       })
//       res.status(200).json(jogos)
//     } catch (error) {
//       res.status(500).json({ erro: error })
//     }
//   } else {
//     if (termoNumero <= 3000) {
//       try {
//         const jogos = await prisma.carro.findMany({
//           include: {
//             marca: true,
//           },
//           where: { ano: termoNumero }
//         })
//         res.status(200).json(jogos)
//       } catch (error) {
//         res.status(500).json({ erro: error })
//       }
//     } else {
//       try {
//         const jogos = await prisma.carro.findMany({
//           include: {
//             marca: true,
//           },
//           where: { preco: { lte: termoNumero } }
//         })
//         res.status(200).json(jogos)
//       } catch (error) {
//         res.status(500).json({ erro: error })
//       }
//     }
//   }
// })

// router.get("/:id", async (req, res) => {
//   const { id } = req.params

//   try {
//     const carro = await prisma.carro.findUnique({
//       where: { id: Number(id) },
//       include: {
//         marca: true
//       }
//     })
//     res.status(200).json(carro)
//   } catch (error) {
//     res.status(400).json(error)
//   }
// })

export default router
