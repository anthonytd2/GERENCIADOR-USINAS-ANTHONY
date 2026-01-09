import express from 'express';
import { supabase } from '../db.js';

const router = express.Router();

router.get('/', async (req, res) => {
  try {
    // CORREÇÃO: Tabela 'status' em minúsculo
    const { data, error } = await supabase
      .from('status')
      .select('*')
      .order('descricao');

    if (error) throw error;
    res.json(data);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

export default router;