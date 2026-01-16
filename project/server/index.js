import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';

import usinasRoutes from './routes/usinas.js';
import consumidoresRoutes from './routes/consumidores.js';
import vinculosRoutes from './routes/vinculos.js';
import propostasRoutes from './routes/propostas.js';
import financeiroRoutes from './routes/financeiro.js'; // <--- Nova Rota
import concessionariasRoutes from './routes/concessionarias.js';
import statusRoutes from './routes/status.js';
import entidadesRoutes from './routes/entidades.js';

dotenv.config();
const app = express();

app.use(cors());
app.use(express.json());

// Rotas
app.use('/api/usinas', usinasRoutes);
app.use('/api/consumidores', consumidoresRoutes);
app.use('/api/vinculos', vinculosRoutes);
app.use('/api/propostas', propostasRoutes);
app.use('/api/financeiro', financeiroRoutes); // <--- Registrando aqui
app.use('/api/concessionarias', concessionariasRoutes);
app.use('/api/status', statusRoutes);
app.use('/api/entidades', entidadesRoutes);

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Servidor rodando na porta ${PORT}`);
});