import { PrismaClient } from "@prisma/client"
import { Router } from "express"
import bcrypt from 'bcrypt'
import { z } from 'zod'
import nodemailer from 'nodemailer'
import jwt from 'jsonwebtoken'
const prisma = new PrismaClient()
const router = Router()

// Configuração do transporter do nodemailer
const transporter = nodemailer.createTransport({
  host: process.env.EMAIL_HOST,
  port: Number(process.env.EMAIL_PORT) || 587,
  secure: false,
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS,
  },
});

const usuarioSchema = z.object({
  nome: z.string().min(10,
    { message: "Nome deve possuir, no mínimo, 10 caracteres" }),
  email: z.string().email(),
  senha: z.string()
})

// Schema para validação da atualização de status
const statusSchema = z.object({
    ativo: z.boolean(),
});

router.get("/", async (req, res) => {
  try {
    // Adicionado 'ativo' ao select para o frontend saber o status
    const usuarios = await prisma.usuario.findMany({
        select: {
            id: true,
            nome: true,
            email: true,
            createdAt: true,
            ativo: true
        }
    })
    res.status(200).json(usuarios)
  } catch (error) {
    res.status(400).json(error)
  }
})

function validaSenha(senha: string) {

  const mensa: string[] = []

  if (senha.length < 8) {
    mensa.push("Erro... senha deve possuir, no mínimo, 8 caracteres")
  }

  let pequenas = 0
  let grandes = 0
  let numeros = 0
  let simbolos = 0

  for (const letra of senha) {
    if ((/[a-z]/).test(letra)) {
      pequenas++
    }
    else if ((/[A-Z]/).test(letra)) {
      grandes++
    }
    else if ((/[0-9]/).test(letra)) {
      numeros++
    } else {
      simbolos++
    }
  }

  if (pequenas == 0) {
    mensa.push("Erro... senha deve possuir letra(s) minúscula(s)")
  }
  if (grandes == 0) {
    mensa.push("Erro... senha deve possuir letra(s) maiúscula(s)")
  }
  if (numeros == 0) {
    mensa.push("Erro... senha deve possuir número(s)")
  }
  if (simbolos == 0) {
    mensa.push("Erro... senha deve possuir símbolo(s)")
  }

  return mensa
}

router.post("/", async (req, res) => {

  const valida = usuarioSchema.safeParse(req.body)
  if (!valida.success) {
    res.status(400).json({ erro: valida.error })
    return
  }

  const erros = validaSenha(valida.data.senha)
  if (erros.length > 0) {
    res.status(400).json({ erro: erros.join("; ") })
    return
  }

  const salt = bcrypt.genSaltSync(12)
  const hash = bcrypt.hashSync(valida.data.senha, salt)

  const { nome, email } = valida.data

  try {
    // Adicionado 'ativo: true' para definir um valor padrão na criação
    const usuario = await prisma.usuario.create({
      data: { nome, email, senha: hash, ativo: true }
    })
    res.status(201).json(usuario)
  } catch (error) {
    res.status(400).json(error)
  }
})

router.get("/:id", async (req, res) => {
  const { id } = req.params
  try {
    // Adicionado 'ativo' ao select para obter o status
    const usuario = await prisma.usuario.findFirst({
      where: { id },
      select: {
          id: true,
          nome: true,
          email: true,
          createdAt: true,
          ativo: true
      }
    })
    res.status(200).json(usuario)
  } catch (error) {
    res.status(400).json(error)
  }
})

// ROTA PUT ADICIONADA PARA ATIVAR/DESATIVAR
router.put("/:id", async (req, res) => {
    const { id } = req.params;

    const result = statusSchema.safeParse(req.body);
    if (!result.success) {
        return res.status(400).json({ erro: "Dado inválido. 'ativo' deve ser um booleano." });
    }

    const { ativo } = result.data;

    try {
        const usuarioAtualizado = await prisma.usuario.update({
            where: { id: id },
            data: { ativo },
        });
        res.status(200).json(usuarioAtualizado);
    } catch (error) {
        if (error instanceof Error && (error as any).code === 'P2025') {
            return res.status(404).json({ erro: "Utilizador não encontrado." });
        }
        const errorMessage = error instanceof Error ? error.message : "Ocorreu um erro desconhecido";
        res.status(500).json({ erro: errorMessage });
    }
});

// ROTA DELETE ADICIONADA PARA APAGAR UM USUÁRIO
router.delete("/:id", async (req, res) => {
    const { id } = req.params;

    try {
        await prisma.usuario.delete({
            where: { id: id },
        });
        res.status(200).json({ message: "Utilizador apagado com sucesso." });
    } catch (error) {
        if (error instanceof Error && (error as any).code === 'P2025') {
            return res.status(404).json({ erro: "Utilizador não encontrado." });
        }
        if (error instanceof Error && (error as any).code === 'P2003') {
            return res.status(409).json({ erro: "Não é possível apagar este utilizador pois ele possui registos associados (ex: avaliações)." });
        }
        const errorMessage = error instanceof Error ? error.message : "Ocorreu um erro desconhecido";
        res.status(500).json({ erro: errorMessage });
    }
});

router.post("/esqueci-senha", async (req, res) => {
  const { email } = req.body;

  if (!email) {
    return res.status(400).json({ erro: "E-mail é obrigatório." });
  }

  try {
    const usuario = await prisma.usuario.findUnique({ where: { email } });

    // Mesmo que o utilizador não exista, enviamos uma resposta de sucesso
    // para não revelar quais e-mails estão ou não registados.
    if (!usuario) {
      return res.status(200).json({ message: "Se o e-mail estiver registado, um link de redefinição foi enviado." });
    }

    // Cria um token de redefinição que expira em 10 minutos
    const resetToken = jwt.sign(
      { id: usuario.id }, 
      process.env.JWT_SECRET as string, 
      { expiresIn: '10m' }
    );

    // Constrói o link que o utilizador irá receber
    const resetLink = `http://localhost:3000/redefinir-senha/${resetToken}`; // Use a URL do seu frontend

    // Envia o e-mail
    await transporter.sendMail({
      from: `"Avenida Reviews" <${process.env.EMAIL_USER}>`,
      to: email,
      subject: "Redefinição de Senha",
      html: `
        <h1>Redefinição de Senha</h1>
        <p>Você solicitou uma redefinição de senha. Clique no link abaixo para criar uma nova senha:</p>
        <a href="${resetLink}">Redefinir Senha</a>
        <p>Este link expira em 10 minutos.</p>
      `,
    });

    res.status(200).json({ message: "Se o e-mail estiver registado, um link de redefinição foi enviado." });

  } catch (error) {
    console.error("Erro no processo de esqueci-senha:", error);
    res.status(500).json({ erro: "Ocorreu um erro interno." });
  }
});

router.post("/redefinir-senha", async (req, res) => {
  const { token, senha } = req.body;

  if (!token || !senha) {
    return res.status(400).json({ erro: "Token e nova senha são obrigatórios." });
  }

  try {
    // 1. Verifica se o token é válido e não expirou
    const decoded = jwt.verify(token, process.env.JWT_SECRET as string) as { id: string };

    // 2. Gera o hash da nova senha
    const salt = await bcrypt.genSalt(12);
    const senhaHash = await bcrypt.hash(senha, salt);

    // 3. Atualiza a senha do utilizador no banco de dados
    await prisma.usuario.update({
      where: { id: decoded.id },
      data: { senha: senhaHash },
    });

    res.status(200).json({ message: "Senha redefinida com sucesso!" });

  } catch (error) {
    // Se o jwt.verify falhar (token inválido ou expirado), ele irá lançar um erro
    res.status(401).json({ erro: "Token inválido ou expirado." });
  }
});

export default router
