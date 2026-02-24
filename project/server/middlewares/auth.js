// server/middlewares/auth.js
import { supabase } from '../db.js';

export const verificarToken = async (req, res, next) => {
  console.log("🛡️ SEGURANÇA: Verificando requisição para:", req.originalUrl); // <--- ADICIONE ISTO
  
  try {
    const authHeader = req.headers.authorization;

    if (!authHeader) {
      console.log("❌ BLOQUEADO: Sem Token"); // <--- ADICIONE ISTO
      return res.status(401).json({ error: 'Acesso negado. Token não fornecido.' });
    }

    const token = authHeader.split(' ')[1];
    const { data: { user }, error } = await supabase.auth.getUser(token);

    if (error || !user) {
      console.log("❌ BLOQUEADO: Token Inválido"); // <--- ADICIONE ISTO
      return res.status(401).json({ error: 'Token inválido ou expirado.' });
    }

    console.log("✅ LIBERADO: Usuário autenticado"); // <--- ADICIONE ISTO
    req.user = user;
    next();
  } catch (error) {
    res.status(401).json({ error: 'Falha na autenticação.' });
  }
};