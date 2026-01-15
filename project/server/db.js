import pg from 'pg';
import dotenv from 'dotenv';
import dns from 'dns/promises';

dotenv.config();

const { Pool } = pg;

let poolInstance = null;

// Função que força o sistema a usar IPv4 (Resolve o erro do Render/Supabase)
async function getConfig() {
  let connectionString = process.env.DATABASE_URL;

  try {
    if (!connectionString) {
      console.error("❌ ERRO: DATABASE_URL não definida no .env!");
      return {};
    }

    const url = new URL(connectionString);
    const hostname = url.hostname;

    // Se o endereço não for numérico (IPv4), resolvemos o DNS manualmente
    if (!hostname.match(/^\d+\.\d+\.\d+\.\d+$/)) {
      console.log(`🌐 Resolvendo DNS IPv4 para: ${hostname}...`);
      const addresses = await dns.resolve4(hostname);
      
      if (addresses && addresses.length > 0) {
        console.log(`✅ DNS Resolvido! Conectando via IP: ${addresses[0]}`);
        url.hostname = addresses[0];
        connectionString = url.toString();
      }
    }
  } catch (error) {
    console.warn("⚠️ Falha ao resolver DNS IPv4, tentando conexão padrão:", error.message);
  }

  return {
    connectionString,
    ssl: { rejectUnauthorized: false }
  };
}

// Objeto que substitui o Pool original e conecta do jeito certo
export const pool = {
  query: async (text, params) => {
    if (!poolInstance) {
      const config = await getConfig();
      poolInstance = new Pool(config);
      poolInstance.on('error', (err) => {
        console.error('❌ Erro inesperado no cliente do banco', err);
        process.exit(-1);
      });
    }
    return poolInstance.query(text, params);
  },
  connect: async () => {
    if (!poolInstance) {
        const config = await getConfig();
        poolInstance = new Pool(config);
    }
    return poolInstance.connect();
  }
};

// Cliente Supabase (mantido para compatibilidade de outras partes)
import { createClient } from '@supabase/supabase-js';
const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_ANON_KEY;
export const supabase = (supabaseUrl && supabaseKey) 
  ? createClient(supabaseUrl, supabaseKey) 
  : null;