import 'dotenv/config'; // Lê o arquivo .env
import express from 'express';
import cors from 'cors';

// Importação das rotas
import consumidoresRoutes from './routes/consumidores.js';
import usinasRoutes from './routes/usinas.js';
import vinculosRoutes from './routes/vinculos.js';
import statusRoutes from './routes/status.js';

const app = express();

// 1. Configura quem pode acessar (CORS)
app.use(cors());

// 2. IMPORTANTE: Permite que o servidor entenda dados JSON (O erro estava aqui!)
app.use(express.json());

// 3. Configura as Rotas
app.use('/api/consumidores', consumidoresRoutes);
app.use('/api/usinas', usinasRoutes);
app.use('/api/vinculos', vinculosRoutes);
app.use('/api/status', statusRoutes);

// O Render escolhe a porta dele, ou usa a 3001 se for local
const PORT = process.env.PORT || 3001; 
app.listen(PORT, () => {
  console.log(`✅ Servidor rodando na porta ${PORT}`);
});