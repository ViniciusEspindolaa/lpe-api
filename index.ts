// No seu ficheiro src/index.ts da API

import dotenv from 'dotenv'
dotenv.config()
import express from 'express'
import cors from 'cors'

// Importe todas as suas rotas
import routesJogos from './routes/jogos'
import routesFotos from './routes/fotos'
import routesLogin from './routes/login'
import routesUsuarios from './routes/usuarios'
import routesAvaliacoes from './routes/avaliacoes'
import routesAdmins from './routes/admins'
import routesLoginAdmin from './routes/adminLogin'
import routesDashboard from './routes/dashboard'
import routesGeneros from './routes/generos'


const app = express()
const port = 3001

// A configuração de CORS deve vir ANTES de app.use(express.json()) e das rotas.
app.use(cors({
  origin: "http://localhost:3000",
  methods: ["GET", "POST", "PUT", "DELETE"],
  allowedHeaders: ["Content-Type", "Authorization"],
}));

app.use(express.json());

// As suas rotas vêm DEPOIS de tudo
app.use("/jogos", routesJogos)
app.use("/fotos", routesFotos)
app.use("/usuarios", routesUsuarios)
app.use("/usuarios/login", routesLogin)
app.use("/avaliacoes", routesAvaliacoes)
app.use("/admins", routesAdmins)
app.use("/admins/login", routesLoginAdmin)
app.use("/dashboard", routesDashboard)
app.use("/generos", routesGeneros)


app.get('/', (req, res) => {
  res.send('API: Review de Jogos')
})

export default app; // Adicione no final e remova app.listen()
