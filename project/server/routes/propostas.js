import express from 'express';
import { supabase } from '../db.js';

const router = express.Router();

// LISTAR
router.get('/', async (req, res) => {
  try {
    const { data, error } = await supabase
      .from('propostas')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) throw error;
    res.json(data);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// CRIAR
router.post('/', async (req, res) => {
  try {
    const { consumidor_id, nome_cliente_prospect, concessionaria_id, dados_simulacao, status } = req.body;
    
    const { data, error } = await supabase
      .from('propostas')
      .insert([{ 
        consumidor_id, 
        nome_cliente_prospect, 
        concessionaria_id, 
        dados_simulacao, 
        status 
      }])
      .select()
      .single();

    if (error) throw error;
    res.status(201).json(data);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// ATUALIZAR STATUS
router.put('/:id', async (req, res) => {
  try {
    const { status } = req.body;
    const { data, error } = await supabase
      .from('propostas')
      .update({ status, updated_at: new Date() })
      .eq('id', req.params.id)
      .select()
      .single();

    if (error) throw error;
    res.json(data);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// --- NOVO: EXCLUIR ---
router.delete('/:id', async (req, res) => {
  try {
    const { error } = await supabase
      .from('propostas')
      .delete()
      .eq('id', req.params.id);

    if (error) throw error;
    res.json({ message: 'Proposta excluída com sucesso' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

export default router;