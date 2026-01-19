import express from 'express';
import { supabase } from '../db.js';

const router = express.Router();

// 1. LISTAR TODOS OS VÍNCULOS
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

// 2. BUSCAR UM (Detalhe) - ESTA É A ROTA QUE FALTAVA
router.get('/:id', async (req, res) => {
  try {
    const { data, error } = await supabase
      .from('vinculos')
      .select(`
        *,
        usinas (nome_proprietario, usina_id, tipo, potencia),
        consumidores (nome, consumidor_id, documento, endereco, cidade, uf),
        status (descricao)
      `)
      .eq('vinculo_id', req.params.id) // Busca pelo vinculo_id
      .single();

    if (error) throw error;
    res.json(data);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// 3. CRIAR NOVO VÍNCULO
router.post('/', async (req, res) => {
  try {
    const { usina_id, consumidor_id, percentual, data_inicio } = req.body;
    
    // Status ID 1 = Ativo (ajuste conforme o ID do seu banco)
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

// 4. ENCERRAR VÍNCULO
router.put('/:id/encerrar', async (req, res) => {
  try {
    const { data_fim } = req.body;
    const { data, error } = await supabase
      .from('vinculos')
      .update({ 
        data_fim, 
        status_id: 2 // Status ID 2 = Encerrado/Inativo
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