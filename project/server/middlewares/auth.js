import { supabase } from '../db.js';
import { createClient } from '@supabase/supabase-js';

export const verificarToken = async (req, res, next) => {
  console.log("🛡️ SEGURANÇA: Verificando requisição para:", req.originalUrl); 
  
  try {
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      console.log("❌ BLOQUEADO: Sem Token ou formato inválido"); 
      return res.status(401).json({ error: 'Acesso negado. Token ausente ou mal formatado.' });
    }

    const token = authHeader.split(' ')[1];
    
    // A validação criptográfica do Supabase
    const { data: { user }, error } = await supabase.auth.getUser(token);

    if (error || !user) {
      console.log("❌ BLOQUEADO: Token Inválido ou Expirado"); 
      return res.status(401).json({ error: 'Token inválido ou expirado.' });
    }

    console.log(`✅ LIBERADO: Usuário autenticado (${user.email})`);
    req.user = user;

    // 🟢 CRIA O CLIENTE SUPABASE COM A IDENTIDADE DO UTILIZADOR
    req.supabase = createClient(
      process.env.SUPABASE_URL,
      process.env.SUPABASE_ANON_KEY,
      {
        global: {
          headers: {
            Authorization: `Bearer ${token}`
          }
        }
      }
    );

    next();
  } catch (error) {
    console.error("❌ ERRO NO MIDDLEWARE DE AUTH:", error.message);
    res.status(500).json({ error: 'Falha interna no servidor.' });
  }
};