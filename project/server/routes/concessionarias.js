import express from 'express';
import { supabase } from '../db.js';

const router = express.Router();

// LISTAR TODAS (Para preencher o Select na tela)
router.get('/', async (req, res) => {
  try {
    const { data, error } = await supabase
      .from('concessionarias')
      .select('*')
      .order('nome');

    if (error) throw error;
    res.json(data);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

export default router;