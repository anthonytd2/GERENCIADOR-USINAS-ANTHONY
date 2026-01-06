import 'dotenv/config';
import { createClient } from '@supabase/supabase-js';

const url = process.env.VITE_SUPABASE_URL;
const key = process.env.VITE_SUPABASE_ANON_KEY;

console.log("--- DIAGNÓSTICO DE CONEXÃO ---");
console.log("1. Verificando credenciais...");
console.log("   URL:", url ? "OK (Encontrada)" : "ERRO (Vazia)");
console.log("   Key:", key ? "OK (Encontrada)" : "ERRO (Vazia)");

if (!url || !key) {
    console.error("\n[ERRO CRÍTICO] O arquivo .env não foi lido ou está vazio.");
    console.error("Certifique-se de que o arquivo .env está na raiz do projeto (fora da pasta server).");
    process.exit(1);
}

const supabase = createClient(url, key);

async function testar() {
    console.log("\n2. Tentando buscar dados no Supabase...");
    // Tenta buscar 1 consumidor
    const { data, error } = await supabase.from('Consumidores').select('*').limit(1);
    
    if (error) {
        console.error("\n[FALHA NO BANCO DE DADOS]");
        console.error("Mensagem de Erro:", error.message);
        console.error("Detalhes:", error);
    } else {
        console.log("\n[SUCESSO] Conexão estabelecida com sucesso!");
        console.log("Tabela Consumidores encontrada.");
        console.log("Dados recebidos:", data);
    }
}

testar();