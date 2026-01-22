import 'dotenv/config'; // Adicione isto na linha 1
import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import usinasRoutes from './routes/usinas.js';
import vinculosRoutes from './routes/vinculos.js';
import consumidoresRoutes from './routes/consumidores.js'; // <--- ESTA LINHA É CRÍTICA
import financeiroRoutes from './routes/financeiro.js';
import fechamentosRoutes from './routes/fechamentos.js';
import statusRoutes from './routes/status.js';
import concessionariasRoutes from './routes/concessionarias.js';
import documentosRoutes from './routes/documentos.js';
import dashboardRoutes from './routes/dashboard.js';
import propostasRoutes from './routes/propostas.js';
import entidadesRoutes from './routes/entidades.js';

dotenv.config();

const app = express();
const port = process.env.PORT || 3000;

app.use(cors());
app.use(express.json());

// Registro das Rotas na API
app.use('/api/usinas', usinasRoutes);
app.use('/api/vinculos', vinculosRoutes);
app.use('/api/consumidores', consumidoresRoutes); // <--- ESTA LINHA FALTAVA OU ESTAVA ERRADA
app.use('/api/financeiro', financeiroRoutes);
app.use('/api/fechamentos', fechamentosRoutes);
app.use('/api/status', statusRoutes);
app.use('/api/concessionarias', concessionariasRoutes);
app.use('/api/documentos', documentosRoutes);
app.use('/api/dashboard', dashboardRoutes);
app.use('/api/propostas', propostasRoutes);
app.use('/api/entidades', entidadesRoutes);
app.use('/api/dashboard', dashboardRoutes);
// Rota de Teste (Raiz)
app.get('/', (req, res) => {
  res.json({ message: 'API Gestão Usinas Solar Online 🚀' });
});

// Tratamento de Erros Global
app.use((err, req, res, next) => {
  console.error("Erro interno:", err.stack);
  res.status(500).json({ error: 'Erro interno do servidor', detail: err.message });
});

app.listen(port, () => {
  console.log(`⚡ Servidor rodando na porta ${port}`);
});