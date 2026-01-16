import express from 'express';
import { supabase } from '../db.js';

const router = express.Router();

// LISTAR PROPOSTAS (Pipeline)
router.get('/', async (req, res) => {
  try {
    const { data, error } = await supabase
      .from('propostas')
      .select('*')
      .order('created_at', { ascending: false }); // Mais recentes primeiro

    if (error) throw error;
    res.json(data);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// CRIAR NOVA PROPOSTA (Salvar do Simulador)
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
    console.error('Erro ao salvar proposta:', error);
    res.status(500).json({ error: error.message });
  }
});

// ATUALIZAR STATUS (Mover no Pipeline)
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

export default router;