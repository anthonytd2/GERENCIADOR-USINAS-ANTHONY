import express from 'express';
import { supabase } from '../db.js';

const router = express.Router();

// LISTAR TODAS AS EMPRESAS
router.get('/', async (req, res) => {
  const { data, error } = await supabase
    .from('entidades')
    .select('*')
    .order('nome');

  if (error) return res.status(500).json({ error: error.message });
  res.json(data);
});

// CADASTRAR NOVA EMPRESA
router.post('/', async (req, res) => {
  const { nome, documento, endereco, cidade, uf } = req.body;
  
  const { data, error } = await supabase
    .from('entidades')
    .insert([{ nome, documento, endereco, cidade, uf }])
    .select();

  if (error) return res.status(500).json({ error: error.message });
  res.status(201).json(data[0]);
});

// DELETAR EMPRESA
router.delete('/:id', async (req, res) => {
  const { id } = req.params;
  const { error } = await supabase.from('entidades').delete().eq('id', id);
  
  if (error) return res.status(500).json({ error: error.message });
  res.json({ message: 'Deletado com sucesso' });
});

export default router;