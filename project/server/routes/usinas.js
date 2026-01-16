import express from 'express';
import { supabase } from '../db.js';
import { usinaSchema } from '../validators/schemas.js';

const router = express.Router();

// --- ROTA DE DIAGNÓSTICO E LISTAGEM ---
router.get('/', async (req, res) => {
  try {
    // CORREÇÃO: Usar 'NomeProprietario' (Maiúsculo) porque o banco foi criado assim
    const { data, error } = await supabase
      .from('Usinas') // Tente 'Usinas' com Maiúscula também, por segurança
      .select('*')
      .order('NomeProprietario'); 

    if (error) throw error;
    res.json(data);
  } catch (error) {
    // Se falhar com Maiúscula, tentamos listar as colunas para você ver o nome real
    console.error("Erro ao listar usinas:", error);
    res.status(500).json({ 
      erro: "Erro ao consultar banco de dados",
      mensagem_tecnica: error.message,
      dica: "Verifique se a tabela é 'Usinas' ou 'usinas' no Supabase."
    });
  }
});

// BUSCAR UMA USINA
router.get('/:id', async (req, res) => {
  try {
    const { data, error } = await supabase
      .from('Usinas')
      .select('*')
      .eq('UsinaID', req.params.id) // CORREÇÃO: UsinaID
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
    // Nota: Se a tabela Vinculos também foi criada com maiúsculas, ajuste aqui:
    // .from('Vinculos').select('*, Consumidores(Nome), Status(Descricao)')
    const { data, error } = await supabase
      .from('Vinculos') 
      .select('*, Consumidores(Nome), Status(Descricao)') 
      .eq('UsinaID', req.params.id);

    if (error) throw error;
    res.json(data);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// CRIAR
router.post('/', async (req, res) => {
  try {
    const dadosLimpos = usinaSchema.parse(req.body);
    const { data, error } = await supabase
      .from('Usinas')
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
    const dadosLimpos = usinaSchema.partial().parse(req.body);
    const { data, error } = await supabase
      .from('Usinas')
      .update(dadosLimpos)
      .eq('UsinaID', req.params.id)
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
    const { error } = await supabase
      .from('Usinas')
      .delete()
      .eq('UsinaID', req.params.id);
    if (error) throw error;
    res.json({ message: 'Usina excluída' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

export default router;