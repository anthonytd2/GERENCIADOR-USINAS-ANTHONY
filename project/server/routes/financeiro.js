import express from 'express';
import { supabase } from '../db.js';

const router = express.Router();

// LISTAR (Cópia de segurança do fechamentos.js)
router.get('/:vinculoId', async (req, res) => {
  try {
    const { data, error } = await supabase
      .from('fechamentos')
      .select(`
        *,
        unidades_consumidoras (codigo_uc, endereco, bairro)
      `)
      // Mantemos 'vinculo_id' pois é o nome da coluna na tabela fechamentos
      .eq('vinculo_id', req.params.vinculoId) 
      .order('mes_referencia', { ascending: false });

    if (error) throw error;
    res.json(data);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Se houver POST ou PUT aqui, eles provavelmente estão quebrados ou desatualizados.
// Por segurança, deixe apenas o GET que é o mais comum de ser usado em relatórios legados.

export default router;