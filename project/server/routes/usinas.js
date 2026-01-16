import express from 'express';
import { supabase } from '../db.js';
import { usinaSchema } from '../validators/schemas.js';

const router = express.Router();

// --- ROTA DE DIAGNÓSTICO E LISTAGEM ---
router.get('/', async (req, res) => {
  // 1. Verificação de Segurança da Conexão
  if (!supabase) {
    console.error("❌ ERRO CRÍTICO: Cliente Supabase é NULL.");
    return res.status(500).json({ 
      erro: "ERRO DE CONFIGURAÇÃO NO RENDER",
      detalhe: "As variáveis SUPABASE_URL ou SUPABASE_ANON_KEY não foram encontradas. Verifique a aba 'Environment' no painel do Render."
    });
  }

  try {
    console.log("✅ Conexão Supabase OK. Tentando buscar usinas...");
    
    // 2. Tenta buscar as usinas
    const { data, error } = await supabase
      .from('usinas')
      .select('*')
      .order('nomeproprietario');

    if (error) {
      console.error("❌ Erro no Banco de Dados:", error);
      throw error;
    }

    console.log(`📦 Sucesso! ${data.length} usinas encontradas.`);
    res.json(data);

  } catch (error) {
    // Retorna a mensagem real do erro para o navegador
    res.status(500).json({ 
      erro: "Erro ao consultar banco de dados",
      mensagem_tecnica: error.message,
      dica: error.code === '42P01' ? "A tabela 'usinas' não existe no banco." : "Verifique os logs do servidor."
    });
  }
});

// BUSCAR UMA USINA
router.get('/:id', async (req, res) => {
  try {
    if (!supabase) throw new Error("Cliente Supabase não inicializado");

    const { data, error } = await supabase
      .from('usinas')
      .select('*')
      .eq('usinaid', req.params.id)
      .single();

    if (error) throw error;
    res.json(data);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// LISTAR VÍNCULOS
router.get('/:id/vinculos', async (req, res) => {
  try {
    if (!supabase) throw new Error("Cliente Supabase não inicializado");

    const { data, error } = await supabase
      .from('vinculos')
      .select('*, consumidores(nome), status(descricao)') 
      .eq('usinaid', req.params.id);

    if (error) throw error;
    res.json(data);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// CRIAR
router.post('/', async (req, res) => {
  try {
    if (!supabase) throw new Error("Cliente Supabase não inicializado");
    const dadosLimpos = usinaSchema.parse(req.body);
    const { data, error } = await supabase
      .from('usinas')
      .insert([dadosLimpos])
      .select()
      .single();
    if (error) throw error;
    res.status(201).json(data);
  } catch (error) {
    const msg = error.issues ? error.issues.map(i => i.message).join(' | ') : error.message;
    res.status(500).json({ error: msg });
  }
});

// ATUALIZAR
router.put('/:id', async (req, res) => {
  try {
    if (!supabase) throw new Error("Cliente Supabase não inicializado");
    const dadosLimpos = usinaSchema.partial().parse(req.body);
    const { data, error } = await supabase
      .from('usinas')
      .update(dadosLimpos)
      .eq('usinaid', req.params.id)
      .select()
      .single();
    if (error) throw error;
    res.json(data);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// EXCLUIR
router.delete('/:id', async (req, res) => {
  try {
    if (!supabase) throw new Error("Cliente Supabase não inicializado");
    const { error } = await supabase
      .from('usinas')
      .delete()
      .eq('usinaid', req.params.id);
    if (error) throw error;
    res.json({ message: 'Usina excluída' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

export default router;