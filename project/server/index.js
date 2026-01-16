import express from 'express';
import cors from 'cors';
import { supabase } from './db.js';

// Importação das rotas
import usinasRoutes from './routes/usinas.js';
import consumidoresRoutes from './routes/consumidores.js';
import vinculosRoutes from './routes/vinculos.js';
import statusRoutes from './routes/status.js';
import entidadesRoutes from './routes/entidades.js';
import fechamentosRoutes from './routes/fechamentos.js'; // <--- ADICIONE ISSO
import dashboardRoutes from './routes/dashboard.js'; // <--- ADICIONAR IMPORT
const app = express();
const port = process.env.PORT || 3001;

app.use(cors());
app.use(express.json());

// Rota de teste
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', message: 'Servidor rodando corretamente' });
});

// Configuração das rotas
app.use('/api/usinas', usinasRoutes);
app.use('/api/consumidores', consumidoresRoutes);
app.use('/api/vinculos', vinculosRoutes);
app.use('/api/status', statusRoutes);
app.use('/api/entidades', entidadesRoutes);
app.use('/api/fechamentos', fechamentosRoutes); // <--- ADICIONE ISSO

// Rota padrão para 404 (opcional, ajuda a debugar)
app.use((req, res) => {
  res.status(404).json({ error: 'Rota não encontrada' });
});

app.use('/api/entidades', entidadesRoutes);
app.use('/api/dashboard', dashboardRoutes); // <--- ADICIONAR USO DA ROTA

app.listen(port, () => {
  console.log(`Servidor rodando na porta ${port}`);
});