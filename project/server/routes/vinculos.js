import express from 'express';
import { supabase } from '../db.js';

const router = express.Router();

// LISTAR TODOS OS VÍNCULOS
router.get('/', async (req, res) => {
  try {
    const { data, error } = await supabase
      .from('vinculos')
      .select(`
        *,
        usinas (nome_proprietario, usina_id),
        consumidores (nome, consumidor_id),
        status (descricao)
      `);

    if (error) throw error;
    res.json(data);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// CRIAR NOVO VÍNCULO
router.post('/', async (req, res) => {
  try {
    const { usina_id, consumidor_id, percentual, data_inicio } = req.body;
    
    // Define status inicial como ATIVO (ID 1 - ajuste conforme sua tabela status)
    const status_id = 1; 

    const { data, error } = await supabase
      .from('vinculos')
      .insert([{ usina_id, consumidor_id, percentual, data_inicio, status_id }])
      .select()
      .single();

    if (error) throw error;
    res.status(201).json(data);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// ENCERRAR VÍNCULO (Atualizar data fim)
router.put('/:id/encerrar', async (req, res) => {
  try {
    const { data_fim } = req.body;
    const { data, error } = await supabase
      .from('vinculos')
      .update({ 
        data_fim, 
        status_id: 2 // Assumindo 2 = INATIVO/ENCERRADO
      })
      .eq('vinculo_id', req.params.id)
      .select()
      .single();

    if (error) throw error;
    res.json(data);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

export default router;