import express from 'express';
import cors from 'cors';

const app = express();

// Usar uma configuração de CORS simples para o teste
app.use(cors());
app.use(express.json());

// Uma única rota de teste
app.get('/', (req, res) => {
  // Adiciona um log para sabermos que a função foi executada
  console.log("Rota de teste '/' foi acedida com sucesso.");
  res.status(200).send('API de Teste a Funcionar!');
});

// Outra rota de teste para verificar o routing
app.get('/teste', (req, res) => {
  console.log("Rota de teste '/teste' foi acedida com sucesso.");
  res.status(200).send('Rota de teste funciona!');
});

// Exportar a aplicação para a Vercel
export default app;
