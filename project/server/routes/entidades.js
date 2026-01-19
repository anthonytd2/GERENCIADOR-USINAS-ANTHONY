import express from 'express';
import { supabase } from '../db.js';

const router = express.Router();

// LISTAR
router.get('/', async (req, res) => {
  try {
    const { data, error } = await supabase
      .from('entidades')
      .select('*')
      .order('nome');

    if (error) throw error;
    res.json(data);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// CADASTRAR (Padronizado com .single())
router.post('/', async (req, res) => {
  try {
    const { nome, documento, endereco, cidade, uf } = req.body;
    
    const { data, error } = await supabase
      .from('entidades')
      .insert([{ nome, documento, endereco, cidade, uf }])
      .select()
      .single(); // Garante que retorna um objeto, não um array

    if (error) throw error;
    res.status(201).json(data);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// DELETAR
router.delete('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const { error } = await supabase.from('entidades').delete().eq('id', id);
    
    if (error) throw error;
    res.json({ message: 'Deletado com sucesso' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

export default router;