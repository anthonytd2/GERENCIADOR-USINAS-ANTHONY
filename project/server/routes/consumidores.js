import express from 'express';
import { supabase } from '../db.js';

const router = express.Router();

// --- 1. LISTAR TODOS OS CONSUMIDORES ---
router.get('/', async (req, res) => {
  try {
    const { data, error } = await supabase
      .from('Consumidores') // Nome exato da tabela
      .select('*')
      .order('Nome');

    if (error) throw error;
    res.json(data);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// --- 2. BUSCAR UM CONSUMIDOR (DETALHES) ---
router.get('/:id', async (req, res) => {
  try {
    const { data, error } = await supabase
      .from('Consumidores')
      .select('*')
      .eq('ConsumidorID', req.params.id) // Nome exato da coluna ID
      .single();

    if (error) throw error;
    if (!data) return res.status(404).json({ error: 'Consumidor not found' });
    
    res.json(data);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// --- 3. BUSCAR VÍNCULOS DO CONSUMIDOR ---
router.get('/:id/vinculos', async (req, res) => {
  try {
    // Busca os vínculos e faz o JOIN com Usinas e Status
    const { data, error } = await supabase
      .from('Vinculos')
      .select(`
        VinculoID,
        StatusID,
        Usinas ( NomeProprietario ),
        Status ( Descricao )
      `)
      .eq('ConsumidorID', req.params.id);

    if (error) {
      console.error("Erro ao buscar vínculos:", error);
      throw error;
    }
    res.json(data);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// --- 4. CRIAR NOVO CONSUMIDOR ---
router.post('/', async (req, res) => {
  try {
    const { data, error } = await supabase
      .from('Consumidores')
      .insert([req.body])
      .select()
      .single();

    if (error) throw error;
    res.status(201).json(data);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// --- 5. ATUALIZAR CONSUMIDOR ---
router.put('/:id', async (req, res) => {
  try {
    const { data, error } = await supabase
      .from('Consumidores')
      .update(req.body)
      .eq('ConsumidorID', req.params.id)
      .select()
      .single();

    if (error) throw error;
    res.json(data);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// --- 6. EXCLUIR CONSUMIDOR ---
router.delete('/:id', async (req, res) => {
  try {
    const { error } = await supabase
      .from('Consumidores')
      .delete()
      .eq('ConsumidorID', req.params.id);

    if (error) throw error;
    res.status(204).send();
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

export default router;