import express from 'express';
import { supabase } from '../db.js';

const router = express.Router();

router.get('/', async (req, res) => {
  try {
    // CORREÇÃO: Busca na tabela 'status', mas ordena por 'Descricao' (Maiúsculo)
    // Se der erro, tente trocar .from('status') por .from('Status')
    const { data, error } = await supabase
      .from('status') 
      .select('*')
      .order('Descricao'); 

    if (error) throw error;
    res.json(data);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

export default router;