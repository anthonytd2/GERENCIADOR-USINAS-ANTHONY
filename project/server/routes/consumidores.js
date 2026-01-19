import express from 'express';
import { supabase } from '../db.js';

const router = express.Router();

// 1. LISTAR TODOS
router.get('/', async (req, res) => {
  try {
    const { data, error } = await supabase
      .from('consumidores') // tabela minúscula
      .select('*')
      .order('nome');

    if (error) throw error;
    res.json(data);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// 2. BUSCAR UM (Para Editar)
router.get('/:id', async (req, res) => {
  try {
    const { data, error } = await supabase
      .from('consumidores')
      .select('*')
      .eq('consumidor_id', req.params.id) // snake_case
      .single();

    if (error) throw error;
    res.json(data);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// 3. CRIAR
router.post('/', async (req, res) => {
  try {
    const { data, error } = await supabase
      .from('consumidores')
      .insert([req.body])
      .select()
      .single();

    if (error) throw error;
    res.status(201).json(data);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// 4. ATUALIZAR
router.put('/:id', async (req, res) => {
  try {
    const { data, error } = await supabase
      .from('consumidores')
      .update(req.body)
      .eq('consumidor_id', req.params.id) // snake_case
      .select()
      .single();

    if (error) throw error;
    res.json(data);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// 5. DELETAR (O que estava dando erro 404)
router.delete('/:id', async (req, res) => {
  try {
    // Primeiro verifica se tem vínculos (Segurança)
    const checkVinculos = await supabase
      .from('vinculos')
      .select('vinculo_id')
      .eq('consumidor_id', req.params.id);

    if (checkVinculos.data && checkVinculos.data.length > 0) {
      return res.status(400).json({ error: 'Não é possível excluir: Cliente possui vínculos ativos.' });
    }

    const { error } = await supabase
      .from('consumidores')
      .delete()
      .eq('consumidor_id', req.params.id); // snake_case

    if (error) throw error;
    res.json({ message: 'Consumidor excluído com sucesso' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

export default router;