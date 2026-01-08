import express from 'express';
import { supabase } from '../db.js';

const router = express.Router();

// LISTAR TODAS (COM STATUS DE VÍNCULO)
router.get('/', async (req, res) => {
  try {
    // CORRIGIDO: Tabelas em minúsculo (usinas e vinculos)
    const { data, error } = await supabase
      .from('usinas') 
      .select('*, vinculos(VinculoID)') 
      .order('NomeProprietario');

    if (error) throw error;
    res.json(data);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// BUSCAR UMA (DETALHES)
router.get('/:id', async (req, res) => {
  try {
    // CORRIGIDO: usinas
    const { data, error } = await supabase
      .from('usinas')
      .select('*')
      .eq('UsinaID', req.params.id) // ATENÇÃO: Verifique se a coluna chama 'UsinaID' ou 'id' no banco
      .single();

    if (error) throw error;
    if (!data) return res.status(404).json({ error: 'Usina não encontrada' });
    res.json(data);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// BUSCAR VÍNCULOS DESTA USINA
router.get('/:id/vinculos', async (req, res) => {
  try {
    // CORRIGIDO: vinculos, consumidores e status em minúsculo
    const { data, error } = await supabase
      .from('vinculos')
      .select(`
        VinculoID,
        StatusID,
        consumidores ( Nome ),
        status ( Descricao )
      `)
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
    // CORRIGIDO: usinas
    const { data, error } = await supabase
      .from('usinas')
      .insert([req.body])
      .select()
      .single();

    if (error) throw error;
    res.status(201).json(data);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// ATUALIZAR
router.put('/:id', async (req, res) => {
  try {
    // CORRIGIDO: usinas
    const { data, error } = await supabase
      .from('usinas')
      .update(req.body)
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
    // CORRIGIDO: usinas
    const { error } = await supabase
      .from('usinas')
      .delete()
      .eq('UsinaID', req.params.id);

    if (error) throw error;
    res.status(204).send();
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

export default router;