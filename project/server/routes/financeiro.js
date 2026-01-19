import express from 'express';
import { supabase } from '../db.js';

const router = express.Router();

// LISTAR
router.get('/:vinculoId', async (req, res) => {
  try {
    const { data, error } = await supabase
      .from('fechamentos')
      .select('*')
      .eq('vinculo_id', req.params.vinculoId) // Atualizado
      .order('mes_referencia', { ascending: false }); // Atualizado

    if (error) throw error;
    res.json(data);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Nota: As rotas POST e PUT são idênticas ao fechamentos.js. 
// Recomendo usar apenas um arquivo de rota no futuro para não duplicar código.
// Mas para manter compatibilidade agora, use o mesmo código do fechamentos.js acima.

export default router;