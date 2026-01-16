import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';

import usinasRoutes from './routes/usinas.js';
import consumidoresRoutes from './routes/consumidores.js';
import vinculosRoutes from './routes/vinculos.js';
import propostasRoutes from './routes/propostas.js';
import financeiroRoutes from './routes/financeiro.js'; 
import concessionariasRoutes from './routes/concessionarias.js';
import statusRoutes from './routes/status.js';
import entidadesRoutes from './routes/entidades.js';
// --- NOVO IMPORT ---
import dashboardRoutes from './routes/dashboard.js'; 

dotenv.config();
const app = express();

app.use(cors());
app.use(express.json());

// Rotas
app.use('/api/usinas', usinasRoutes);
app.use('/api/consumidores', consumidoresRoutes);
app.use('/api/vinculos', vinculosRoutes);
app.use('/api/propostas', propostasRoutes);
app.use('/api/financeiro', financeiroRoutes);
app.use('/api/concessionarias', concessionariasRoutes);
app.use('/api/status', statusRoutes);
app.use('/api/entidades', entidadesRoutes);
// --- NOVA ROTA REGISTRADA ---
app.use('/api/dashboard', dashboardRoutes); 

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Servidor rodando na porta ${PORT}`);
});