import pg from 'pg';
import dotenv from 'dotenv';
import dns from 'dns/promises';

dotenv.config();

const { Pool } = pg;

// Variável para guardar nossa conexão real
let poolInstance = null;

// Função auxiliar para resolver o endereço IPv4 (Evita o erro ENETUNREACH IPv6)
async function getConfig() {
  let connectionString = process.env.DATABASE_URL;

  try {
    const url = new URL(connectionString);
    const hostname = url.hostname;

    // Se não for um IP, tenta resolver para IPv4
    if (!hostname.match(/^\d+\.\d+\.\d+\.\d+$/)) {
      console.log(`🌐 Resolvendo DNS IPv4 para: ${hostname}...`);
      const addresses = await dns.resolve4(hostname);
      
      if (addresses && addresses.length > 0) {
        console.log(`✅ DNS Resolvido! Conectando via IP: ${addresses[0]}`);
        // Substitui o domínio pelo IP na string de conexão
        url.hostname = addresses[0];
        connectionString = url.toString();
      }
    }
  } catch (error) {
    console.warn("⚠️ Falha ao resolver DNS IPv4, tentando conexão padrão:", error.message);
  }

  return {
    connectionString,
    ssl: {
      rejectUnauthorized: false // Necessário para o Supabase
    }
  };
}

// Exportamos um objeto que imita o Pool, mas conecta do jeito certo na primeira vez
export const pool = {
  query: async (text, params) => {
    // Se ainda não conectou, cria a conexão agora
    if (!poolInstance) {
      const config = await getConfig();
      poolInstance = new Pool(config);
      
      // Tratamento de erro para não derrubar o servidor se a conexão cair depois
      poolInstance.on('error', (err) => {
        console.error('❌ Erro inesperado no cliente do banco', err);
        process.exit(-1);
      });
    }
    
    // Executa a query normalmente
    return poolInstance.query(text, params);
  },
  
  // Repassa outros métodos se necessário
  connect: async () => {
    if (!poolInstance) {
        const config = await getConfig();
        poolInstance = new Pool(config);
    }
    return poolInstance.connect();
  }
};

// Cliente Supabase opcional (mantido para compatibilidade)
import { createClient } from '@supabase/supabase-js';
const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_ANON_KEY;
// Só cria se tiver as chaves
export const supabase = (supabaseUrl && supabaseKey) 
  ? createClient(supabaseUrl, supabaseKey) 
  : null;