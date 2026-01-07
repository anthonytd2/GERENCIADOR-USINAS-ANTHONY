import express from 'express';
import { supabase } from '../db.js';

const router = express.Router();

// LISTAR
router.get('/', async (req, res) => {
  const { data, error } = await supabase.from('Entidades').select('*').order('Nome');
  if (error) return res.status(500).json({ error: error.message });
  res.json(data);
});

// CRIAR
router.post('/', async (req, res) => {
  const { data, error } = await supabase.from('Entidades').insert([req.body]).select().single();
  if (error) return res.status(500).json({ error: error.message });
  res.status(201).json(data);
});

// ATUALIZAR
router.put('/:id', async (req, res) => {
  const { data, error } = await supabase.from('Entidades').update(req.body).eq('EntidadeID', req.params.id);
  if (error) return res.status(500).json({ error: error.message });
  res.json(data);
});

// DELETAR
router.delete('/:id', async (req, res) => {
  const { error } = await supabase.from('Entidades').delete().eq('EntidadeID', req.params.id);
  if (error) return res.status(500).json({ error: error.message });
  res.status(204).send();
});

export default router;