import 'dotenv/config'; 
import express from 'express';
import cors from 'cors';
import usinasRoutes from './routes/usinas.js';
import vinculosRoutes from './routes/vinculos.js';
import consumidoresRoutes from './routes/consumidores.js';
import financeiroRoutes from './routes/financeiro.js';
import fechamentosRoutes from './routes/fechamentos.js';
import statusRoutes from './routes/status.js';
import concessionariasRoutes from './routes/concessionarias.js';
import documentosRoutes from './routes/documentos.js'; 
import dashboardRoutes from './routes/dashboard.js';
import propostasRoutes from './routes/propostas.js';
import entidadesRoutes from './routes/entidades.js';
import relatoriosRoutes from './routes/relatorios.js';
import protocolosRoutes from './routes/protocolos.js';
import dashboardBalancoRoutes from './routes/dashboard_balanco.js';


const app = express();
const port = process.env.PORT || 3000;

app.use(cors());
app.use(express.json());

// Registro das Rotas na API
app.use('/api/usinas', usinasRoutes);
app.use('/api/vinculos', vinculosRoutes);
app.use('/api/consumidores', consumidoresRoutes);
app.use('/api/financeiro', financeiroRoutes);
app.use('/api/fechamentos', fechamentosRoutes);
app.use('/api/status', statusRoutes);
app.use('/api/concessionarias', concessionariasRoutes);
app.use('/api/cpf_cnpjs', documentosRoutes); 
app.use('/api/dashboard', dashboardRoutes);
app.use('/api/propostas', propostasRoutes);
app.use('/api/entidades', entidadesRoutes);
app.use('/api/relatorios', relatoriosRoutes);
app.use('/api/dashboard-balanco', dashboardBalancoRoutes);

// Rota de Teste (Raiz)
app.get('/', (req, res) => {
  res.json({ message: 'API Gestão Usinas Solar Online 🚀' });
});

// Tratamento de Erros Global
app.use((err, req, res, next) => {
  console.error("Erro interno:", err.stack);
  res.status(500).json({ error: 'Erro interno do servidor', detail: err.message });
});

app.use('/api/protocolos', protocolosRoutes);

app.listen(port, () => {
  console.log(`⚡ Servidor rodando na porta ${port}`);
});