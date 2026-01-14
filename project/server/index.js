import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';

// ... suas importações antigas ...
import vinculosRoutes from './routes/vinculos.js';
import usinasRoutes from './routes/usinas.js';
import consumidoresRoutes from './routes/consumidores.js';
import entidadesRoutes from './routes/entidades.js';
import statusRoutes from './routes/status.js';
import fechamentosRoutes from './routes/fechamentos.js';

// --- ADICIONE ESTAS DUAS LINHAS ---
import concessionariasRoutes from './routes/concessionarias.js';
import propostasRoutes from './routes/propostas.js';
// ----------------------------------

dotenv.config();
const app = express();
app.use(cors());
app.use(express.json());

// ... suas rotas antigas ...
app.use('/api/vinculos', vinculosRoutes);
app.use('/api/usinas', usinasRoutes);
app.use('/api/consumidores', consumidoresRoutes);
app.use('/api/entidades', entidadesRoutes);
app.use('/api/status', statusRoutes);
app.use('/api/fechamentos', fechamentosRoutes);

// --- ADICIONE ESTAS DUAS LINHAS ---
app.use('/api/concessionarias', concessionariasRoutes);
app.use('/api/propostas', propostasRoutes);
// ----------------------------------

const port = process.env.PORT || 3000;
app.listen(port, () => {
  console.log(`Servidor rodando na porta ${port}`);
});