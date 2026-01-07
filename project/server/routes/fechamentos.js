import express from 'express';
import { supabase } from '../db.js';

const router = express.Router();

// 1. LISTAR (Busca os relatórios daquele vínculo)
router.get('/:vinculoId', async (req, res) => {
  const { data, error } = await supabase
    .from('Fechamentos')
    .select('*')
    .eq('VinculoID', req.params.vinculoId)
    .order('MesReferencia', { ascending: false }); // Meses mais novos primeiro

  if (error) return res.status(500).json({ error: error.message });
  res.json(data);
});

// 2. CRIAR (Salva o que você digitou)
router.post('/', async (req, res) => {
  try {
    const { VinculoID, MesReferencia, EnergiaCompensada, ValorRecebido, ValorPago, Spread } = req.body;

    const { data, error } = await supabase
      .from('Fechamentos')
      .insert([{
        VinculoID,
        MesReferencia,
        EnergiaCompensada,
        ValorRecebido,
        ValorPago,
        Spread
      }])
      .select()
      .single();

    if (error) throw error;
    res.status(201).json(data);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// 3. EXCLUIR (Caso digite errado)
router.delete('/:id', async (req, res) => {
  const { error } = await supabase
    .from('Fechamentos')
    .delete()
    .eq('FechamentoID', req.params.id);

  if (error) return res.status(500).json({ error: error.message });
  res.status(204).send();
});

export default router;