import express from 'express';
import { supabase } from '../db.js';

const router = express.Router();

router.get('/stats', async (req, res) => {
  try {
    // count: 'exact', head: true -> Isso diz ao Supabase: "Só me dê o número, não quero os dados"
    // Isso é extremamente rápido pois não baixa as listas, apenas conta.
    
    const { count: totalConsumidores } = await supabase
      .from('consumidores')
      .select('*', { count: 'exact', head: true });

    const { count: totalUsinas } = await supabase
      .from('usinas')
      .select('*', { count: 'exact', head: true });

    const { count: totalVinculos } = await supabase
      .from('vinculos')
      .select('*', { count: 'exact', head: true });

    res.json({
      totalConsumidores: totalConsumidores || 0,
      totalUsinas: totalUsinas || 0,
      totalVinculos: totalVinculos || 0
    });
  } catch (error) {
    console.error('Erro Stats:', error);
    res.status(500).json({ error: 'Erro ao buscar estatísticas' });
  }
});

export default router;