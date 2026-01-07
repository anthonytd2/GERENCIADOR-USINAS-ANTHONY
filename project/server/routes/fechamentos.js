import express from 'express';
import { supabase } from '../db.js';

const router = express.Router();

// LISTAR
router.get('/:vinculoId', async (req, res) => {
  const { data, error } = await supabase
    .from('Fechamentos')
    .select('*')
    .eq('VinculoID', req.params.vinculoId)
    .order('MesReferencia', { ascending: false });

  if (error) return res.status(500).json({ error: error.message });
  res.json(data);
});

// CRIAR
router.post('/', async (req, res) => {
  try {
    // ATUALIZADO: Agora aceita ArquivoURL
    const { VinculoID, MesReferencia, EnergiaCompensada, ValorRecebido, ValorPago, Spread, ArquivoURL } = req.body;

    const { data, error } = await supabase
      .from('Fechamentos')
      .insert([{
        VinculoID,
        MesReferencia,
        EnergiaCompensada,
        ValorRecebido,
        ValorPago,
        Spread,
        ArquivoURL // Novo campo
      }])
      .select()
      .single();

    if (error) throw error;
    res.status(201).json(data);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// EXCLUIR
router.delete('/:id', async (req, res) => {
  const { error } = await supabase.from('Fechamentos').delete().eq('FechamentoID', req.params.id);
  if (error) return res.status(500).json({ error: error.message });
  res.status(204).send();
});

export default router;