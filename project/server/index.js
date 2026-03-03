import "dotenv/config";
import express from "express";
import cors from "cors";
import helmet from "helmet"; 
import rateLimit from "express-rate-limit"; 

import usinasRoutes from "./routes/usinas.js";
import vinculosRoutes from "./routes/vinculos.js";
import consumidoresRoutes from "./routes/consumidores.js";
import financeiroRoutes from "./routes/financeiro.js";
import fechamentosRoutes from "./routes/fechamentos.js";
import statusRoutes from "./routes/status.js";
import concessionariasRoutes from "./routes/concessionarias.js";
import documentosRoutes from "./routes/documentos.js";
import dashboardRoutes from "./routes/dashboard.js";
import propostasRoutes from "./routes/propostas.js";
import entidadesRoutes from "./routes/entidades.js";
import relatoriosRoutes from "./routes/relatorios.js";
import protocolosRoutes from "./routes/protocolos.js";
import dashboardBalancoRoutes from "./routes/dashboard_balanco.js";
import { verificarToken } from "./middlewares/auth.js";

const app = express();

// Configuração OBRIGATÓRIA para nuvem (Render, Heroku, etc)
app.set('trust proxy', 1);

// 🟢 HELMET: Protege cabeçalhos HTTP e oculta que o servidor usa Express
app.use(helmet()); 

// 🟢 MASCARAMENTO: Função para nunca exibir senhas ou tokens nos logs do console
const maskSensitiveData = (obj) => {
  if (!obj || typeof obj !== 'object') return obj;
  
  const sensitiveFields = [
    'senha', 'password', 'senha_copel', 'token', 
    'auth', 'secret', 'senhaCopel', 'access_token'
  ];

  const masked = Array.isArray(obj) ? [...obj] : { ...obj };

  for (const key in masked) {
    if (sensitiveFields.includes(key.toLowerCase())) {
      masked[key] = '******** [CONFIDENCIAL]';
    } else if (typeof masked[key] === 'object') {
      masked[key] = maskSensitiveData(masked[key]);
    }
  }
  return masked;
};

// 🟢 LOGGING SEGURO: Registra requisições POST/PUT sem vazar dados sensíveis
app.use((req, res, next) => {
  if (req.method !== 'GET' && req.method !== 'OPTIONS') {
    const cleanBody = maskSensitiveData(req.body);
    console.log(`[${new Date().toISOString()}] ${req.method} ${req.url} - Payload verificado.`);
    // Opcional: console.log('Dados recebidos (limpos):', cleanBody);
  }
  next();
});

app.get('/health', (req, res) => {
  res.status(200).json({ 
    status: 'OK',
    message: 'Servidor Bionova operando normalmente' 
  });
});
const port = process.env.PORT || 3000;

// 🟢 CORS BLINDADO: Apenas origens autorizadas
const allowedOrigins = [
  process.env.FRONTEND_URL ? process.env.FRONTEND_URL.replace(/\/$/, "") : null,
  "https://gerenciador-usinas-anthony.vercel.app", 
  "http://localhost:5173",
].filter(Boolean);

app.use(
  cors({
    origin: function (origin, callback) {
      if (!origin) {
         console.warn(`🚨 CORS BLOQUEADO: Tentativa de acesso sem origem definida (Postman/Scripts)`);
         return callback(new Error("Bloqueado pelo CORS: Acesso por API externa não autorizado"));
      }

      const cleanOrigin = origin.replace(/\/$/, "");

      if (allowedOrigins.includes(cleanOrigin)) {
        callback(null, true);
      } else {
        console.warn(`🚨 CORS BLOQUEADO: Tentativa de acesso do domínio -> ${origin}`);
        callback(new Error("Bloqueado pelo CORS: Origem não permitida"));
      }
    },
    credentials: true,
    methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"], 
    allowedHeaders: ["Content-Type", "Authorization"], 
  }),
);

// 🟢 PAYLOAD LIMIT: Prevenção contra ataques de negação de serviço (DoS) por memória
app.use(express.json({ limit: '10mb' })); 

// 🟢 RATE LIMIT: Proteção contra ataques de força bruta e robôs
const apiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, 
  max: 200, 
  standardHeaders: true, 
  legacyHeaders: false, 
  message: { 
    error: "Muitas requisições feitas a partir deste IP. Por segurança, tente novamente em 15 minutos." 
  }
});

app.use("/api/", apiLimiter);

// Registro das Rotas na API
app.use("/api/usinas", verificarToken, usinasRoutes);
app.use("/api/vinculos", verificarToken, vinculosRoutes);
app.use("/api/consumidores", verificarToken, consumidoresRoutes);
app.use("/api/financeiro", verificarToken, financeiroRoutes);
app.use("/api/fechamentos", verificarToken, fechamentosRoutes);
app.use("/api/status", verificarToken, statusRoutes);
app.use("/api/concessionarias", verificarToken, concessionariasRoutes);
app.use("/api/cpf_cnpjs", verificarToken, documentosRoutes);
app.use("/api/dashboard", verificarToken, dashboardRoutes);
app.use("/api/propostas", verificarToken, propostasRoutes);
app.use("/api/entidades", verificarToken, entidadesRoutes);
app.use("/api/relatorios", verificarToken, relatoriosRoutes);
app.use("/api/dashboard-balanco", verificarToken, dashboardBalancoRoutes);
app.use("/api/protocolos", verificarToken, protocolosRoutes);

app.get("/", (req, res) => {
  res.json({ message: "API Gestão Usinas Solar Online 🚀" });
});

// 🟢 ERROR HANDLING: Tratamento de Erros Global (Esconde detalhes técnicos do cliente)
app.use((err, req, res, next) => {
  console.error("Erro interno:", err.message);
  
  const isDev = process.env.NODE_ENV === 'development';
  res
    .status(500)
    .json({ 
        error: "Erro interno do servidor", 
        detail: isDev ? err.message : "Contate o suporte técnico." 
    });
});

app.listen(port, () => {
  console.log(`⚡ Servidor blindado e monitorado rodando na porta ${port}`);
});