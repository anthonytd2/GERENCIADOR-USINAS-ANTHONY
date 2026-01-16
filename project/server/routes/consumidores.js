import express from 'express';
import { supabase } from '../db.js';

const router = express.Router();

// LISTAR
router.get('/', async (req, res) => {
  try {
    const { data, error } = await supabase.from('consumidores').select('*').order('Nome');
    if (error) throw error;
    res.json(data);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// LISTAR UM
router.get('/:id', async (req, res) => {
  try {
    const { data, error } = await supabase
      .from('consumidores')
      .select('*')
      .eq('ConsumidorID', req.params.id)
      .maybeSingle(); // Usamos maybeSingle para não dar erro 500 se não achar

    if (error) throw error;
    if (!data) return res.status(404).json({ error: 'Consumidor não encontrado' });
    
    res.json(data);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// CRIAR
router.post('/', async (req, res) => {
  try {
    const { data, error } = await supabase.from('consumidores').insert([req.body]).select().single();
    if (error) throw error;
    res.status(201).json(data);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// ATUALIZAR
router.put('/:id', async (req, res) => {
  try {
    const { data, error } = await supabase
      .from('consumidores')
      .update(req.body)
      .eq('ConsumidorID', req.params.id)
      .select().single();

    if (error) throw error;
    res.json(data);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// --- CORREÇÃO DO DELETE (Cascata Manual) ---
router.delete('/:id', async (req, res) => {
  try {
    // 1. Primeiro, removemos todos os vínculos deste consumidor
    const { error: errorVinculos } = await supabase
      .from('vinculos') // Nome da tabela em minúsculo (padrão Supabase)
      .delete()
      .eq('ConsumidorID', req.params.id);

    if (errorVinculos) throw errorVinculos;

    // 2. Agora podemos excluir o consumidor sem o banco reclamar
    const { error } = await supabase
      .from('consumidores')
      .delete()
      .eq('ConsumidorID', req.params.id);

    if (error) throw error;
    
    res.json({ message: 'Consumidor e seus vínculos excluídos com sucesso' });
  } catch (error) {
    console.error('Erro ao excluir:', error);
    res.status(500).json({ error: error.message });
  }
});

export default router;