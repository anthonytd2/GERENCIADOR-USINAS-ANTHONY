import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';

// Imports existentes
import usinasRoutes from './routes/usinas.js';
import consumidoresRoutes from './routes/consumidores.js';
import vinculosRoutes from './routes/vinculos.js';
import propostasRoutes from './routes/propostas.js';
import financeiroRoutes from './routes/financeiro.js'; 
import concessionariasRoutes from './routes/concessionarias.js';
import statusRoutes from './routes/status.js';
import entidadesRoutes from './routes/entidades.js';
import dashboardRoutes from './routes/dashboard.js';

// --- NOVOS IMPORTS (Conectando o que faltava) ---
import fechamentosRoutes from './routes/fechamentos.js';
// Se você não tiver um arquivo 'recibos.js', pode usar o financeiroRoutes ou criar um.
// Vou assumir que recibos pode estar dentro de financeiro por enquanto.

dotenv.config();
const app = express();

app.use(cors());
app.use(express.json());

// Registro das Rotas
app.use('/api/usinas', usinasRoutes);
app.use('/api/consumidores', consumidoresRoutes);
app.use('/api/vinculos', vinculosRoutes);
app.use('/api/propostas', propostasRoutes);
app.use('/api/financeiro', financeiroRoutes);
app.use('/api/concessionarias', concessionariasRoutes);
app.use('/api/status', statusRoutes);
app.use('/api/entidades', entidadesRoutes);
app.use('/api/dashboard', dashboardRoutes);

// --- NOVA ROTA REGISTRADA ---
app.use('/api/fechamentos', fechamentosRoutes); 

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Servidor rodando na porta ${PORT}`);
});