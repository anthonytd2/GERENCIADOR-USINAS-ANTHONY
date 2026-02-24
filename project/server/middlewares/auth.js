// server/middlewares/auth.js
import { supabase } from '../db.js';

export const verificarToken = async (req, res, next) => {
  console.log("🛡️ SEGURANÇA: Verificando requisição para:", req.originalUrl); 
  
  try {
    const authHeader = req.headers.authorization;

    // 🟢 AJUSTE: Verifica se existe E se começa exatamente com a palavra "Bearer "
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      console.log("❌ BLOQUEADO: Sem Token ou formato inválido"); 
      return res.status(401).json({ error: 'Acesso negado. Token ausente ou mal formatado.' });
    }

    const token = authHeader.split(' ')[1];
    
    // A validação criptográfica rigorosa do Supabase (Você já tinha feito certinho!)
    const { data: { user }, error } = await supabase.auth.getUser(token);

    if (error || !user) {
      console.log("❌ BLOQUEADO: Token Inválido ou Expirado"); 
      return res.status(401).json({ error: 'Token inválido ou expirado.' });
    }

    console.log(`✅ LIBERADO: Usuário autenticado (${user.email})`);
    req.user = user;
    next();
  } catch (error) {
    console.error("❌ ERRO NO MIDDLEWARE DE AUTH:", error.message);
    res.status(500).json({ error: 'Falha interna no servidor durante a autenticação.' });
  }
};