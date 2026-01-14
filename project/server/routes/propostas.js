import express from 'express';
import { supabase } from '../db.js';

const router = express.Router();

// LISTAR PROPOSTAS (Com filtro opcional por status)
router.get('/', async (req, res) => {
  try {
    let query = supabase
      .from('propostas')
      .select(`
        *,
        concessionarias (nome),
        consumidores (nome)
      `)
      .order('created_at', { ascending: false });

    // Se mandar ?status=Enviada na URL, filtra
    if (req.query.status) {
      query = query.eq('status', req.query.status);
    }

    const { data, error } = await query;
    if (error) throw error;
    res.json(data);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// CRIAR NOVA PROPOSTA
router.post('/', async (req, res) => {
  try {
    const { data, error } = await supabase
      .from('propostas')
      .insert([req.body])
      .select()
      .single();

    if (error) throw error;
    res.status(201).json(data);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// ATUALIZAR STATUS OU DADOS
router.put('/:id', async (req, res) => {
  try {
    const { data, error } = await supabase
      .from('propostas')
      .update({
        ...req.body,
        updated_at: new Date()
      })
      .eq('id', req.params.id)
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
      .from('propostas')
      .delete()
      .eq('id', req.params.id);

    if (error) throw error;
    res.status(204).send();
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

export default router;